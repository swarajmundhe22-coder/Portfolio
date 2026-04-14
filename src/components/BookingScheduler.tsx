import { memo, useEffect, useMemo, useRef, useState } from 'react';
import type { ClipboardEvent, FormEvent, MouseEvent } from 'react';
import {
  AlertCircle,
  Bold,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Globe2,
  Italic,
  List,
  LoaderCircle,
  Send,
} from 'lucide-react';
import {
  MONTH_NAMES,
  buildBookingSummary,
  buildCalendarGrid,
  createTimeSlots,
  firstSelectableDate,
  getMonthAvailability,
  stripRichTextToPlainText,
  validateBookingForm,
  type BookingValidationErrors,
} from '../lib/bookingUtils';

interface BookingSchedulerProps {
  className?: string;
  visualRegressionMode?: boolean;
}

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

const FROZEN_NOW = new Date('2026-04-05T09:30:00.000Z');

const monthStatusLabel: Record<string, string> = {
  available: 'Available',
  limited: 'Limited',
  unavailable: 'Unavailable',
};

const toDateLabel = (isoDate: string): string =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date(`${isoDate}T00:00:00`));

const moveCaretToEnd = (element: HTMLElement): void => {
  if (typeof window === 'undefined' || !window.getSelection) {
    return;
  }

  const selection = window.getSelection();
  if (!selection) {
    return;
  }

  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);

  selection.removeAllRanges();
  selection.addRange(range);
};

const BookingScheduler = ({ className, visualRegressionMode = false }: BookingSchedulerProps) => {
  const now = useMemo(() => (visualRegressionMode ? FROZEN_NOW : new Date()), [visualRegressionMode]);
  const timezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  }, []);

  const selectedYear = now.getFullYear();
  const monthAvailability = useMemo(() => getMonthAvailability(selectedYear), [selectedYear]);

  const [selectedMonth, setSelectedMonth] = useState(() => (visualRegressionMode ? 3 : now.getMonth()));
  const [selectedDateIso, setSelectedDateIso] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [name, setName] = useState(() => (visualRegressionMode ? 'Swaraj Mundhe' : ''));
  const [email, setEmail] = useState(() => (visualRegressionMode ? 'swaraj@example.com' : ''));

  const defaultMessageHtml = visualRegressionMode
    ? '<p>Need architecture support for a production-grade frontend and secure booking workflow launch.</p>'
    : '<p></p>';

  const [messageText, setMessageText] = useState(() => stripRichTextToPlainText(defaultMessageHtml));
  const [messageLength, setMessageLength] = useState(() => stripRichTextToPlainText(defaultMessageHtml).length);
  const [formAttempted, setFormAttempted] = useState(false);
  const [formErrors, setFormErrors] = useState<BookingValidationErrors>({});
  const [formStatus, setFormStatus] = useState<FormStatus>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const editorRef = useRef<HTMLDivElement | null>(null);
  const lastValidEditorContent = useRef({
    html: defaultMessageHtml,
    text: stripRichTextToPlainText(defaultMessageHtml),
  });

  const calendarCells = useMemo(
    () => buildCalendarGrid(selectedYear, selectedMonth, now),
    [selectedYear, selectedMonth, now],
  );

  const availableDays = useMemo(
    () =>
      calendarCells.filter(
        (cell) => Boolean(cell.isoDate) && cell.isCurrentMonth && !cell.isDisabled,
      ),
    [calendarCells],
  );

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = defaultMessageHtml;
    }
  }, [defaultMessageHtml]);

  useEffect(() => {
    const validIsoDates = new Set(
      availableDays
        .map((cell) => cell.isoDate)
        .filter((value): value is string => Boolean(value)),
    );

    if (!selectedDateIso || !validIsoDates.has(selectedDateIso)) {
      setSelectedDateIso(firstSelectableDate(calendarCells));
    }
  }, [availableDays, calendarCells, selectedDateIso]);

  const timeSlots = useMemo(
    () => (selectedDateIso ? createTimeSlots(selectedDateIso, timezone) : []),
    [selectedDateIso, timezone],
  );

  useEffect(() => {
    if (timeSlots.length === 0) {
      setSelectedTime(null);
      return;
    }

    const selectedStillAvailable = selectedTime
      ? timeSlots.some((slot) => slot.value === selectedTime && slot.isAvailable)
      : false;

    if (!selectedStillAvailable) {
      setSelectedTime(timeSlots.find((slot) => slot.isAvailable)?.value ?? null);
    }
  }, [selectedTime, timeSlots]);

  const activeMonthMeta = monthAvailability[selectedMonth];

  const formInput = useMemo(
    () => ({
      name,
      email,
      selectedDateIso,
      selectedTime,
      messageText,
      timezone,
    }),
    [email, messageText, name, selectedDateIso, selectedTime, timezone],
  );

  useEffect(() => {
    if (!formAttempted) {
      return;
    }

    setFormErrors(validateBookingForm(formInput));
  }, [formAttempted, formInput]);

  const applyEditorCommand = (command: 'bold' | 'italic' | 'insertUnorderedList') => {
    if (!editorRef.current || typeof document === 'undefined') {
      return;
    }

    editorRef.current.focus();
    document.execCommand(command, false);
  };

  const syncEditorState = () => {
    if (!editorRef.current) {
      return;
    }

    const nextHtml = editorRef.current.innerHTML;
    const nextText = stripRichTextToPlainText(nextHtml);

    if (nextText.length > 500) {
      editorRef.current.innerHTML = lastValidEditorContent.current.html;
      moveCaretToEnd(editorRef.current);
      return;
    }

    lastValidEditorContent.current = {
      html: nextHtml,
      text: nextText,
    };

    setMessageText(nextText);
    setMessageLength(nextText.length);
  };

  const onEditorPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const plainText = event.clipboardData.getData('text/plain');

    if (!plainText) {
      return;
    }

    if (typeof document !== 'undefined') {
      document.execCommand('insertText', false, plainText);
    }

    syncEditorState();
  };

  const onSelectMonth = (monthIndex: number) => {
    setSelectedMonth(monthIndex);
    setFormStatus('idle');
    setFeedbackMessage('');
  };

  const onSelectDay = (isoDate: string) => {
    setSelectedDateIso(isoDate);
    setFormStatus('idle');
    setFeedbackMessage('');
  };

  const onSubmitBooking = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormAttempted(true);

    const validation = validateBookingForm(formInput);
    setFormErrors(validation);

    if (Object.keys(validation).length > 0) {
      setFormStatus('error');
      setFeedbackMessage('Please resolve the highlighted fields before submitting.');
      return;
    }

    setFormStatus('submitting');
    setFeedbackMessage('Submitting your booking request...');

    const summary = buildBookingSummary(selectedDateIso as string, selectedTime as string, timezone);
    const payload = {
      name: name.trim(),
      email: email.trim(),
      message: `${summary}\n\n${messageText.trim()}`,
    };

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = 'Unable to complete booking submission.';

        try {
          const details = (await response.json()) as {
            error?: {
              message?: string;
            };
          };
          errorMessage = details.error?.message || errorMessage;
        } catch {
          // Use fallback message when payload is not JSON.
        }

        throw new Error(errorMessage);
      }

      setFormStatus('success');
      setFeedbackMessage('Booking request submitted. Check your inbox for next steps.');

      if (!visualRegressionMode) {
        setMessageText('');
        setMessageLength(0);
        setSelectedTime(timeSlots.find((slot) => slot.isAvailable)?.value ?? null);
        if (editorRef.current) {
          editorRef.current.innerHTML = '<p></p>';
        }
      }
    } catch (error) {
      setFormStatus('error');
      setFeedbackMessage(
        error instanceof Error
          ? error.message
          : 'Network error. Please try again or use direct email contact.',
      );
    }
  };

  const selectedDateLabel = selectedDateIso ? toDateLabel(selectedDateIso) : 'Choose a day';
  const selectedTimeLabel =
    timeSlots.find((slot) => slot.value === selectedTime)?.label ?? 'Choose a slot';

  const onToolbarMouseDown = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  return (
    <div className={`booking-stage ${className || ''}`.trim()}>
      <form className="scheduler-shell scheduler-shell-enhanced" noValidate onSubmit={onSubmitBooking}>
        <aside className="scheduler-profile" aria-label="Booking details">
          <p className="caps">Discovery call</p>
          <h4>Reserve a focused session</h4>

          <label className={`booking-field ${formErrors.name ? 'has-error' : ''}`}>
            <span>Name</span>
            <input
              type="text"
              value={name}
              placeholder="Your full name"
              onChange={(event) => setName(event.target.value)}
              aria-invalid={Boolean(formErrors.name)}
            />
            {formErrors.name ? <small className="field-error">{formErrors.name}</small> : null}
          </label>

          <label className={`booking-field ${formErrors.email ? 'has-error' : ''}`}>
            <span>Email</span>
            <input
              type="email"
              value={email}
              placeholder="you@company.com"
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(formErrors.email)}
            />
            {formErrors.email ? <small className="field-error">{formErrors.email}</small> : null}
          </label>

          <ul className="booking-summary-list" aria-live="polite">
            <li>
              <CalendarDays size={14} />
              <span>{selectedDateLabel}</span>
            </li>
            <li>
              <Clock3 size={14} />
              <span>{selectedTimeLabel}</span>
            </li>
            <li>
              <Globe2 size={14} />
              <span>{timezone}</span>
            </li>
          </ul>
        </aside>

        <section className="scheduler-calendar" aria-label="Month and day selection">
          <header className="scheduler-calendar-header">
            <p>{selectedYear}</p>
            <span className={`month-status status-${activeMonthMeta.status}`}>
              {monthStatusLabel[activeMonthMeta.status]} month
            </span>
          </header>

          <div className="month-selector" role="tablist" aria-label="Select month">
            {monthAvailability.map((month) => (
              <button
                type="button"
                role="tab"
                key={month.label}
                aria-selected={selectedMonth === month.monthIndex}
                className={`month-option ${selectedMonth === month.monthIndex ? 'is-active' : ''}`}
                onClick={() => onSelectMonth(month.monthIndex)}
              >
                <i className={`availability-dot ${month.status}`} aria-hidden="true" />
                <span>{month.label.slice(0, 3)}</span>
              </button>
            ))}
          </div>

          <div className="scheduler-weekdays">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>

          <div className="scheduler-days scheduler-days-enhanced">
            {calendarCells.map((cell) => {
              if (!cell.dayNumber || !cell.isoDate) {
                return <span key={cell.key} className="calendar-day-placeholder" aria-hidden="true" />;
              }

              const isSelected = selectedDateIso === cell.isoDate;

              return (
                <button
                  type="button"
                  key={cell.key}
                  className={`${isSelected ? 'is-active' : ''} ${cell.isWeekend ? 'is-weekend' : ''}`.trim()}
                  disabled={cell.isDisabled}
                  aria-label={`${MONTH_NAMES[selectedMonth]} ${cell.dayNumber}, ${cell.isWeekend ? 'weekend' : 'weekday'}`}
                  onClick={() => onSelectDay(cell.isoDate as string)}
                >
                  {cell.dayNumber}
                </button>
              );
            })}
          </div>

          {formErrors.selectedDateIso ? (
            <small className="field-error calendar-error">{formErrors.selectedDateIso}</small>
          ) : null}
        </section>

        <aside className="scheduler-slots" aria-label="Time and message selection">
          <div className="timezone-pill">
            <Globe2 size={14} />
            <span>{timezone}</span>
          </div>

          <div className="slot-list slot-list-enhanced" role="listbox" aria-label="Select a time slot">
            {timeSlots.map((slot) => (
              <button
                key={slot.key}
                type="button"
                role="option"
                aria-selected={selectedTime === slot.value}
                className={`${selectedTime === slot.value ? 'is-active' : ''} ${!slot.isAvailable ? 'is-unavailable' : ''}`.trim()}
                disabled={!slot.isAvailable}
                onClick={() => setSelectedTime(slot.value)}
              >
                <span>{slot.label}</span>
                <i className={slot.isAvailable ? 'available' : 'unavailable'}>
                  {slot.isAvailable ? 'Available' : 'Booked'}
                </i>
              </button>
            ))}
          </div>

          {formErrors.selectedTime ? <small className="field-error">{formErrors.selectedTime}</small> : null}

          <div className={`message-editor-shell ${formErrors.messageText ? 'has-error' : ''}`}>
            <div className="message-toolbar" role="toolbar" aria-label="Message formatting controls">
              <button
                type="button"
                onMouseDown={onToolbarMouseDown}
                onClick={() => applyEditorCommand('bold')}
                aria-label="Bold"
              >
                <Bold size={14} />
              </button>
              <button
                type="button"
                onMouseDown={onToolbarMouseDown}
                onClick={() => applyEditorCommand('italic')}
                aria-label="Italic"
              >
                <Italic size={14} />
              </button>
              <button
                type="button"
                onMouseDown={onToolbarMouseDown}
                onClick={() => applyEditorCommand('insertUnorderedList')}
                aria-label="Bulleted list"
              >
                <List size={14} />
              </button>
            </div>
            <div
              ref={editorRef}
              className="message-editor"
              contentEditable
              role="textbox"
              aria-label="Project details message"
              aria-multiline="true"
              suppressContentEditableWarning
              onInput={syncEditorState}
              onPaste={onEditorPaste}
            />
            <div className="message-meta">
              <span className={messageLength >= 500 ? 'limit-reached' : ''}>{messageLength}/500</span>
            </div>
          </div>

          {formErrors.messageText ? <small className="field-error">{formErrors.messageText}</small> : null}

          {feedbackMessage ? (
            <p className={`form-feedback ${formStatus}`} aria-live="polite">
              {formStatus === 'error' ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
              <span>{feedbackMessage}</span>
            </p>
          ) : null}

          <button type="submit" className="primary-action booking-submit" disabled={formStatus === 'submitting'}>
            {formStatus === 'submitting' ? <LoaderCircle size={15} className="spin-icon" /> : <Send size={15} />}
            <span>{formStatus === 'submitting' ? 'Submitting...' : 'Confirm Booking Request'}</span>
          </button>
        </aside>
      </form>
    </div>
  );
};

export default memo(BookingScheduler);
