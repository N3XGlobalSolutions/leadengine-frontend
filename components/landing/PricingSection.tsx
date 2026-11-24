import React, { useState } from 'react';
import { Check, Star, ArrowRight } from 'lucide-react';

interface PricingSectionProps {
    onSelectPlan?: (planName: string) => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onSelectPlan }) => {
    const [isAnnual, setIsAnnual] = useState(false);

    const plans = [
        {
            name: "STARTER",
            popular: false,
            monthlyPrice: 50,
            annualPrice: 40,
            features: [
                "Up to 10 projects",
                "Basic analytics",
                "48-hour support response time",
                "Limited API access",
                "Community support"
            ],
            cta: "Start Free Trial"
        },
        {
            name: "PROFESSIONAL",
            popular: true,
            monthlyPrice: 99,
            annualPrice: 79,
            features: [
                "Unlimited projects",
                "Advanced analytics",
                "24-hour support response time",
                "Full API access",
                "Priority support",
                "Team collaboration",
                "Custom integrations"
            ],
            cta: "Start Free Trial"
        },
        {
            name: "ENTERPRISE",
            popular: false,
            monthlyPrice: 299,
            annualPrice: 239,
            features: [
                "Everything in Professional",
                "Custom solutions",
                "Dedicated account manager",
                "1-hour support response time",
                "SSO Authentication",
                "Advanced security",
                "Custom contracts"
            ],
            cta: "Contact Sales"
        }
    ];

    return (
        <section id="pricing" className="py-24 bg-black text-white relative border-t border-zinc-800 scroll-mt-28">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
                    <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                        Choose the plan that works for you
                    </h2>
                    <p className="text-zinc-400 text-base sm:text-lg">
                        All plans include access to our platform, lead generation tools, and dedicated support.
                    </p>

                    {/* Annual / Monthly Billing Toggle */}
                    <div className="flex items-center justify-center gap-3 pt-6">
                        <button
                            type="button"
                            onClick={() => setIsAnnual(!isAnnual)}
                            className="flex items-center gap-3 group focus:outline-none"
                        >
                            <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${isAnnual ? 'bg-white' : 'bg-zinc-800'}`}>
                                <div className={`w-4 h-4 rounded-full transition-transform duration-300 ${isAnnual ? 'translate-x-6 bg-black' : 'translate-x-0 bg-zinc-400'}`} />
                            </div>
                            <span className="text-sm font-semibold text-zinc-300 group-hover:text-white transition-colors">
                                Annual billing <span className="text-amber-400 font-bold">(Save 20%)</span>
                            </span>
                        </button>
                    </div>
                </div>

                {/* Pricing Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch pt-4">
                    {plans.map((plan) => {
                        const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;

                        return (
                            <div
                                key={plan.name}
                                className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 ${
                                    plan.popular
                                        ? 'bg-zinc-950 border-2 border-white shadow-[0_0_50px_rgba(255,255,255,0.12)] lg:-translate-y-4 z-10'
                                        : 'bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700'
                                }`}
                            >
                                {/* Popular Star Badge */}
                                {plan.popular && (
                                    <div className="absolute -top-4 right-6 bg-white text-black text-xs font-black px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-xl border border-white">
                                        <Star className="w-3.5 h-3.5 fill-black text-black" />
                                        <span>Popular</span>
                                    </div>
                                )}

                                <div>
                                    {/* Plan Title */}
                                    <h3 className="text-center text-xs font-bold tracking-widest text-zinc-400 uppercase mb-6">
                                        {plan.name}
                                    </h3>

                                    {/* Price Header */}
                                    <div className="text-center">
                                        <div className="flex items-baseline justify-center gap-1">
                                            <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                                                US${price}
                                            </span>
                                            <span className="text-zinc-400 text-xs font-medium">
                                                / per month
                                            </span>
                                        </div>
                                        <p className="text-zinc-500 text-xs font-mono mt-2">
                                            {isAnnual ? 'billed annually' : 'billed monthly'}
                                        </p>
                                    </div>

                                    {/* Divider */}
                                    <div className="border-b border-zinc-800/80 my-8" />

                                    {/* Features Checklist */}
                                    <ul className="space-y-4 mb-8">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                                                <Check className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* CTA Button */}
                                <button
                                    onClick={() => onSelectPlan ? onSelectPlan(plan.name) : null}
                                    className={`w-full py-3.5 px-6 rounded-full font-extrabold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                                        plan.popular
                                            ? 'bg-white text-black hover:bg-zinc-200 shadow-lg hover:scale-[1.02]'
                                            : 'border border-zinc-700 bg-transparent text-white hover:bg-white hover:text-black'
                                    }`}
                                >
                                    <span>{plan.cta}</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
