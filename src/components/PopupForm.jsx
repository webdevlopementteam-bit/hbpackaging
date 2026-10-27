"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ACCESS_KEY, WEB3FORMS_URL, inputCls } from "./ContactForm";

const DELAY_MS = 7000;
const SEEN_KEY = "hb_popup_seen";

/* Enquiry popup shown 7s after a visitor lands; once closed or submitted it stays hidden for the session */
export default function PopupForm() {
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (pathname === "/thank-you") return;
    try {
      if (sessionStorage.getItem(SEEN_KEY)) return;
    } catch {}

    const t = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  function close() {
    setOpen(false);
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {}
  }

  async function onSubmit(e) {
    e.preventDefault();

    const form = e.currentTarget;

    setStatus("sending");
    setError("");

    const data = new FormData(form);
    const name = String(data.get("name")).trim();

    data.append("access_key", ACCESS_KEY);
    data.append("subject", `New popup enquiry from ${name} - hbpackaging.in`);
    data.append("from_name", "HB Packaging Website (Popup)");

    try {
      const res = await fetch(WEB3FORMS_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: data,
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(
          json.message || "Something went wrong. Please try again."
        );
      }

      form.reset();
      close();
      router.push("/thank-you");
    } catch (err) {
      setStatus("error");
      setError(err.message || "Something went wrong. Please try again.");
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/60 px-4"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="popup-form-title"
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-[480px] overflow-y-auto rounded-md bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.3)] sm:p-8"
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-2 text-[28px] leading-none text-[#8a8a8a] transition-colors hover:text-p4"
        >
          &times;
        </button>

        <h2 id="popup-form-title" className="mb-1 text-[24px] font-bold text-p4">
          Get a Free Quote
        </h2>
        <p className="mb-5 text-[15px] text-[#555]">
          Share your requirement and our team will get back to you shortly.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Honeypot for spam bots */}
          <input
            type="checkbox"
            name="botcheck"
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />

          <label className="block">
            <span className="sr-only">Name</span>
            <input
              name="name"
              required
              placeholder="Name"
              className={inputCls}
              autoComplete="name"
            />
          </label>

          <label className="block">
            <span className="sr-only">Email</span>
            <input
              name="email"
              type="email"
              required
              placeholder="Email"
              className={inputCls}
              autoComplete="email"
            />
          </label>

          <label className="block">
            <span className="sr-only">Mobile Number</span>
            <input
              name="mobile"
              type="tel"
              required
              placeholder="Mobile Number"
              pattern="[0-9+\-\s]{10,15}"
              title="Enter a valid mobile number"
              className={inputCls}
              autoComplete="tel"
            />
          </label>

          <label className="block">
            <span className="sr-only">Message</span>
            <textarea
              name="message"
              rows={3}
              placeholder="Your requirement (optional)"
              className={`${inputCls} resize-y`}
            />
          </label>

          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full rounded-[3px] bg-p3 px-[22px] py-1 text-[20px] text-white transition-colors hover:bg-p4 disabled:cursor-wait disabled:opacity-70"
          >
            {status === "sending" ? "Sending..." : "Submit"}
          </button>

          {status === "error" && (
            <p
              className="rounded-lg bg-red-50 px-4 py-3 font-medium text-red-700"
              role="alert"
            >
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
