"use client";

import Link from "next/link";

const HomeLink = () => {
  return (
    <Link
      href="/"
      className="text-sm text-indigo-400 underline-offset-4 transition hover:text-indigo-300 hover:underline"
    >
      ← Back to home
    </Link>
  );
};

export default HomeLink;
