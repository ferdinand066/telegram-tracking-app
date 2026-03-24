"use client";

import Link from "next/link";

const HomeLink = () => {
  return (
    <Link
      href="/"
      className="text-primary hover:text-primary/80 text-sm underline-offset-4 transition hover:underline"
    >
      ← Back to home
    </Link>
  );
};

export default HomeLink;
