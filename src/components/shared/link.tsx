import React from "react";

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

export default function Link({ href, children, ...props }: LinkProps) {
  let targetHref = href;
  if (href.startsWith("/") && !href.startsWith("//")) {
    targetHref = "#" + href;
  }
  return (
    <a href={targetHref} {...props}>
      {children}
    </a>
  );
}
