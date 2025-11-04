export default function HeroImage() {
  return (
    <div className="relative h-36 rounded-2xl overflow-hidden border border-[var(--pc-border)] shadow-pc">
      <div className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 90% at 15% 10%, rgba(108,69,211,0.15), transparent 60%), radial-gradient(50% 70% at 85% 30%, rgba(212,175,55,0.12), transparent 60%), var(--pc-surface)",
        }}
      />
      <div className="absolute inset-0 grid place-items-center">
        <div
          className="w-12 h-12 rounded-xl"
          style={{
            background:
              "conic-gradient(from 220deg, var(--pc-primary), var(--pc-gold), var(--pc-primary))",
            boxShadow: "0 10px 30px rgba(10,8,16,0.24)",
          }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}