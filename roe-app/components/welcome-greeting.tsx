"use client";
// Welcome greeting: time-aware hello + one animated line. Minimal words,
// calm motion, static text when reduced motion is preferred.
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const LINE = "No one is lost to silence.";

function greetingFor(hour: number): string {
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 22) return "Good evening";
  return "Hi there!";
}

export default function WelcomeGreeting() {
  const [hello, setHello] = useState("Welcome to ROE.");
  const [typed, setTyped] = useState("");
  const [still, setStill] = useState(false);

  useEffect(() => {
    const h = new Date().getHours();
    const g = greetingFor(h);
    setHello(g === "Hi there!" ? "Hi there! Welcome to ROE." : `${g}, welcome to ROE.`);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStill(true);
      setTyped(LINE);
      return;
    }
    let i = 0;
    let iv: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      iv = setInterval(() => {
        i += 1;
        setTyped(LINE.slice(0, i));
        if (i >= LINE.length && iv) clearInterval(iv);
      }, 45);
    }, 500);
    return () => {
      clearTimeout(start);
      if (iv) clearInterval(iv);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <p className="font-display text-[22px] font-semibold text-[#111827]">{hello}</p>
      <p aria-live="polite" className="mt-1 min-h-[22px] text-[14px] font-medium text-[#0D9488]">
        {typed}
        {!still && typed.length < LINE.length && (
          <span aria-hidden className="ml-0.5 inline-block animate-pulse">|</span>
        )}
      </p>
    </motion.div>
  );
}
