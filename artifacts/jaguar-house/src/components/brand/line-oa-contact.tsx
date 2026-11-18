"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { BrandIcon } from "./brand-icon";

const LINE_OA_URL = "https://line.me/R/ti/p/@880beqva";

export function LineOaContact({ placement }: { placement: "landing" | "member" }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const popupId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const closePopup = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      closePopup();
    };
    const onClose = () => setOpen(false);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("jaguar:close-line-popup", onClose);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("jaguar:close-line-popup", onClose);
    };
  }, [open]);

  const contact = (
    <div
      ref={rootRef}
      className={`line-oa-contact line-oa-contact--${placement}${open ? " is-open" : ""}`}
      aria-label="ติดต่อ JAGUAR SPK ผ่าน LINE"
      role="group"
      data-testid={`line-oa-contact-${placement}`}
    >
      <section id={popupId} className="line-oa-contact__popup" aria-label="LINE Official Account" hidden={!open}>
        <header className="line-oa-contact__header">
          <span className="line-oa-contact__mark"><MessageCircle size={19} strokeWidth={2.2} aria-hidden="true" /></span>
          <span className="line-oa-contact__identity">
            <span className="line-oa-contact__eyebrow">LINE OFFICIAL</span>
            <strong>@880beqva</strong>
          </span>
          <button
            type="button"
            className="line-oa-contact__close"
            aria-label="ปิดหน้าต่าง LINE"
            onClick={closePopup}
          >
            <BrandIcon name="close" size={17} />
          </button>
        </header>
        <a className="line-oa-contact__qr-link" href={LINE_OA_URL} target="_blank" rel="noopener noreferrer">
          <Image
            src="/brand/line-oa-qr.png"
            alt="QR Code สำหรับเพิ่มเพื่อน LINE OA @880beqva"
            width={540}
            height={540}
            sizes="88px"
          />
        </a>
        <p className="line-oa-contact__hint">สแกน QR หรือเปิดแชตร้าน</p>
        <a
          className="line-oa-contact__action"
          href={LINE_OA_URL}
          target="_blank"
          rel="noopener noreferrer"
          data-testid={`link-line-oa-${placement}`}
        >
          แชตร้านใน LINE
          <BrandIcon name="continue" size={16} tone="emerald" />
        </a>
      </section>
      <button
        ref={triggerRef}
        type="button"
        className="line-oa-contact__trigger"
        aria-expanded={open}
        aria-controls={popupId}
        aria-label={open ? "ปิดช่องทาง LINE" : "เปิดช่องทาง LINE"}
        data-testid={`button-line-oa-${placement}`}
        onClick={() => setOpen((current) => {
          if (!current) window.dispatchEvent(new Event("jaguar:close-map-popup"));
          return !current;
        })}
      >
        <MessageCircle size={20} strokeWidth={2.2} aria-hidden="true" />
        <span>LINE OA</span>
      </button>
    </div>
  );

  // Portal the public landing widget directly under <body> so fixed positioning
  // cannot be captured by an animated or isolated page wrapper.
  if (placement === "landing") {
    return mounted ? createPortal(contact, document.body) : null;
  }
  return contact;
}
