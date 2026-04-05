import { z } from 'zod';
import { isSupabaseConfigured, requireSupabase } from './_supabase.js';
import { createSecureHandler, securityEventLog } from './_security.js';

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Name is required.').max(120),
  email: z.string().trim().email('A valid email is required.').max(320),
  message: z.string().trim().min(20, 'Message must include at least 20 characters.').max(5_000),
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
    if (!isSupabaseConfigured) {
      return res.status(503).json({
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Contact service is not configured.',
          requestId,
        },
      });
    }

    const supabase = requireSupabase();
    const payload = {
      name: body.name,
      email: body.email.toLowerCase(),
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

    securityEventLog({
      event: 'contact_message_created',
      requestId,
      ipAddress,
      detail: {
        messageId: data.id,
      },
    });

    return res.status(201).json(data);
  },
);
