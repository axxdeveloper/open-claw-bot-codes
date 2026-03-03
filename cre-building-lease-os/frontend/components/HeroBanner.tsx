type HeroBannerProps = {
  image: string;
  title: string;
  subtitle: string;
  chips?: string[];
};

export default function HeroBanner({ image, title, subtitle, chips = [] }: HeroBannerProps) {
  return (
    <section className="hero" style={{ backgroundImage: `url(${image})` }}>
      <div className="heroOverlay" />
      <div className="heroContent">
        <p className="heroEyebrow">CRE Building Lease OS</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        {chips.length > 0 && (
          <div className="heroChips">
            {chips.map((chip) => (
              <span key={chip}>{chip}</span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
