import { useState } from "react";

export default function StarRating({ value = 0, onChange, size = "sm", readOnly = false }) {
  const [hover, setHover] = useState(0);
  const cls = size === "lg" ? "star-btn" : "star";
  const active = hover || value;

  return (
    <div className={size === "lg" ? "rating-row" : "stars-mini"} style={{ display: "flex", gap: size === "lg" ? 6 : 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={`${cls} ${s <= active ? "on" : "off"}`}
          style={{ cursor: readOnly ? "default" : "pointer", fontSize: size === "lg" ? "1.7rem" : "0.72rem" }}
          onClick={() => !readOnly && onChange && onChange(s)}
          onMouseEnter={() => !readOnly && setHover(s)}
          onMouseLeave={() => !readOnly && setHover(0)}
        >
          ★
        </span>
      ))}
    </div>
  );
}
