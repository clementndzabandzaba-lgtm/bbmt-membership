import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import crestLogo from "../assets/brand/crest.png";
import monkeySilhouette from "../assets/brand/monkey-silhouette.png";

export default function Landing() {
  const navigate = useNavigate();
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.setProperty("--tilt-x", `${(-y * 8).toFixed(2)}deg`);
    card.style.setProperty("--tilt-y", `${(x * 8).toFixed(2)}deg`);
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");
  };

  return (
    <div className="landing">
      <div className="watermark" aria-hidden="true">
        <span className="watermark__text">BBMT</span>
        <img src={monkeySilhouette} className="watermark__monkey watermark__monkey--drift" alt="" />
      </div>

      <div
        className="landing__content"
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="landing__glow" aria-hidden="true" />
        <div className="landing__badge">
          <img src={crestLogo} alt="BBMTC crest: Maiyane a Kgabo Tona, Sedibelo" />
        </div>

        <p className="landing__eyebrow">BBMTC</p>
        <h1 className="landing__title">
          Bakgatla Ba Mosetlha
          <span>Traditional Council</span>
        </h1>
        <p className="landing__tagline">Membership Registration Portal</p>

        <p className="landing__lead">
          Register your household with the Traditional Council to be counted as an
          official member. It only takes a few minutes.
        </p>

        <button className="landing__cta" onClick={() => navigate("/register")}>
          <span>Click to Register →</span>
        </button>
      </div>
    </div>
  );
}
