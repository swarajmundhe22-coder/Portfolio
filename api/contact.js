import { z } from 'zod';
import { isEmailDeliveryConfigured, sendContactInboxEmail } from './_email.js';
import { isSupabaseConfigured, requireSupabase } from './_supabase.js';
import { createSecureHandler, securityEventLog } from './_security.js';

const bookingSchema = z
  .object({
    summary: z.string().trim().min(8).max(500),
    selectedDateIso: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
    selectedTime: z.string().trim().regex(/^\d{2}:\d{2}$/),
    timezone: z.string().trim().min(2).max(120),
  })
  .strict();

const contactSchema = z
  .object({
    name: z.string().trim().min(2, 'Name is required.').max(120),
    email: z.string().trim().email('A valid email is required.').max(320),
    message: z.string().trim().min(20, 'Message must include at least 20 characters.').max(5_000),
    source: z.enum(['contact', 'booking']).optional(),
    booking: bookingSchema.optional(),
  })
  .superRefine((value, context) => {
    if (value.source === 'booking' && !value.booking) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Booking details are required for booking submissions.',
        path: ['booking'],
      });
    }
  });

export default createSecureHandler(
  {
    methods: ['POST'],
    auth: 'none',
    csrf: false,
    bodySchema: contactSchema,
    maxBodyBytes: 80_000,
    rateLimit: {
      windowMs: 60_000,
      max: 12,
    },
  },
  async (_req, res, { body, requestId, ipAddress }) => {
    const source = body.source || 'contact';
    const normalizedEmail = body.email.toLowerCase();
    let storedRecord = null;

    if (isSupabaseConfigured) {
      const supabase = requireSupabase();
      const payload = {
        name: body.name,
        email: normalizedEmail,
        message: body.message,
      };

      const { data, error } = await supabase
        .from('contact_messages')
        .insert([payload])
        .select('id, name, email, message, created_at')
        .single();

      if (error) {
        throw new Error(`CONTACT_INSERT_FAILED:${error.message}`);
      }

      storedRecord = data;
    } else {
      securityEventLog({
        severity: 'warn',
        event: 'contact_storage_skipped',
        requestId,
        ipAddress,
        detail: {
          reason: 'SUPABASE_NOT_CONFIGURED',
        },
      });
    }

    if (!isEmailDeliveryConfigured) {
      return res.status(503).json({
        error: {
          code: 'EMAIL_NOT_CONFIGURED',
          message: 'Email delivery is not configured. Set RESEND_API_KEY (CONTACT_TO_EMAIL is optional).',
          requestId,
        },
      });
    }

    try {
      const delivery = await sendContactInboxEmail({
        source,
        name: body.name,
        email: normalizedEmail,
        message: body.message,
        booking: body.booking,
        requestId,
        ipAddress,
      });

      securityEventLog({
        event: 'contact_message_received',
        requestId,
        ipAddress,
        detail: {
          source,
          storage: Boolean(storedRecord),
          messageId: storedRecord?.id ?? null,
          emailDeliveryId: typeof delivery?.id === 'string' ? delivery.id : null,
        },
      });
    } catch (error) {
      securityEventLog({
        severity: 'error',
        event: 'contact_email_delivery_failed',
        requestId,
        ipAddress,
        detail: {
          source,
          message: error instanceof Error ? error.message : 'unknown_error',
        },
      });

      return res.status(502).json({
        error: {
          code: 'EMAIL_DELIVERY_FAILED',
          message: 'Unable to deliver your request to inbox right now. Please try again shortly.',
          requestId,
        },
      });
    }

    return res.status(201).json(
      storedRecord ?? {
        id: `request-${requestId}`,
        name: body.name,
        email: normalizedEmail,
        message: body.message,
        source,
        created_at: new Date().toISOString(),
      },
    );
  },
);
