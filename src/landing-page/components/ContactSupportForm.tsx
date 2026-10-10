import { useState, type FormEvent, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Mail, Send } from 'lucide-react';
import TopicSelect from './TopicSelect';

const CONTACT_EMAIL = 'pairflowappcontact@gmail.com';
const FORM_ENDPOINT = `https://formsubmit.co/ajax/${CONTACT_EMAIL}`;

const TOPICS = [
  'Pertanyaan tentang produk',
  'Masukan atau ide',
  'Kerja sama',
  'Kendala teknis atau akun',
  'Lainnya',
];

interface FormValues {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const emptyValues: FormValues = { name: '', email: '', subject: '', message: '' };

type FormErrors = Partial<Record<keyof FormValues, string>>;
type Status = 'idle' | 'submitting' | 'success' | 'error';

const fieldClass =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/25';
const errorFieldClass = 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/20';

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
}

export default function ContactSupportForm() {
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<Status>('idle');
  const [serverMessage, setServerMessage] = useState('');

  const updateField = (field: keyof FormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    if (!values.name.trim()) nextErrors.name = 'Nama wajib diisi.';
    if (!values.email.trim()) nextErrors.email = 'Email wajib diisi.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
      nextErrors.email = 'Format email tidak valid.';
    if (!values.subject) nextErrors.subject = 'Pilih topik pesan.';
    if (!values.message.trim()) nextErrors.message = 'Pesan wajib diisi.';
    else if (values.message.trim().length < 10)
      nextErrors.message = 'Tuliskan pesan minimal 10 karakter.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'submitting') return;
    if (!validate()) return;

    const name = values.name.trim();
    const email = values.email.trim();
    const subject = values.subject;
    const message = values.message.trim();

    setStatus('submitting');
    setServerMessage('');

    try {
      const response = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
          _subject: `[PairFlow Support] ${subject}`,
          _replyto: email,
          _template: 'table',
          _captcha: 'false',
        }),
      });

      const data: unknown = await response.json().catch(() => null);
      const dataRecord = (data ?? {}) as Record<string, unknown>;
      const isSuccess = String(dataRecord.success ?? '') === 'true';

      if (!response.ok || !isSuccess) {
        const detail = typeof dataRecord.message === 'string' ? dataRecord.message : '';
        setServerMessage(detail);
        setStatus('error');
        return;
      }

      setValues(emptyValues);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card sm:p-8"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          <Mail className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">
            Kirim pesan ke tim support
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Isi formulir di bawah ini. Pesan akan dikirim ke{' '}
            <span className="font-semibold text-slate-900">{CONTACT_EMAIL}</span>. Jangan
            sertakan kata sandi, kode OTP, atau data rekening.
          </p>
        </div>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <Field label="Nama" htmlFor="contact-name" error={errors.name}>
          <input
            id="contact-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Nama Anda"
            value={values.name}
            onChange={(event) => updateField('name', event.target.value)}
            className={`${fieldClass} ${errors.name ? errorFieldClass : ''}`}
          />
        </Field>

        <Field label="Email" htmlFor="contact-email" error={errors.email}>
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="nama@email.com"
            value={values.email}
            onChange={(event) => updateField('email', event.target.value)}
            className={`${fieldClass} ${errors.email ? errorFieldClass : ''}`}
          />
        </Field>

        <div className="sm:col-span-2">
          <Field label="Topik" htmlFor="contact-subject" error={errors.subject}>
            <TopicSelect
              id="contact-subject"
              name="subject"
              options={TOPICS}
              value={values.subject}
              onChange={(option) => updateField('subject', option)}
              placeholder="Pilih topik pesan"
              error={Boolean(errors.subject)}
            />
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Field label="Pesan" htmlFor="contact-message" error={errors.message}>
            <textarea
              id="contact-message"
              name="message"
              rows={5}
              placeholder="Ceritakan kendala atau pertanyaan Anda beserta langkah yang sudah dicoba."
              value={values.message}
              onChange={(event) => updateField('message', event.target.value)}
              className={`${fieldClass} resize-y ${errors.message ? errorFieldClass : ''}`}
            />
          </Field>
        </div>
      </div>

      {status === 'success' && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
          <p>
            Terima kasih! Pesan Anda sudah terkirim. Kami akan membalas melalui email yang Anda
            cantumkan.
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
          <div>
            <p>
              Pesan belum terkirim. Coba lagi sebentar lagi, atau kirim langsung ke{' '}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-semibold underline underline-offset-2"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
            {serverMessage && <p className="mt-1 text-xs text-rose-700/80">{serverMessage}</p>}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 text-sm font-bold text-white shadow-glow-emerald transition-all hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'submitting' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        {status === 'submitting' ? 'Mengirim...' : 'Kirim Pesan'}
      </button>
    </form>
  );
}
