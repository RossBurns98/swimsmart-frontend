// src/components/ui/Button.jsx
import { forwardRef } from "react";
import { Link } from "react-router-dom";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium " +
  "transition-colors select-none no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

const variants = {
  primary:
    "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border border-zinc-200 dark:border-zinc-800 " +
    "hover:bg-zinc-800 dark:hover:bg-zinc-100 focus:ring-zinc-400",
  outline:
    "bg-transparent text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 " +
    "hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 focus:ring-zinc-400",
};

const sizes = {
  md: "h-9",
  sm: "h-8 px-3",
};

function cx(...cls) {
  return cls.filter(Boolean).join(" ");
}

const Button = forwardRef(
  (
    {
      as,
      to,
      href,
      children,
      className,
      variant = "primary",
      size = "md",
      ...rest
    },
    ref
  ) => {
    const classes = cx(base, variants[variant], sizes[size], "visited:text-inherit", className);

    if (as === Link) {
      return (
        <Link ref={ref} to={to} className={classes} {...rest}>
          {children}
        </Link>
      );
    }
    if (as === "a" || href) {
      return (
        <a ref={ref} href={href} className={classes} {...rest}>
          {children}
        </a>
      );
    }
    return (
      <button ref={ref} className={classes} {...rest}>
        {children}
      </button>
    );
  }
);

export default Button;
