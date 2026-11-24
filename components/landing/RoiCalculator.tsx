import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Slider } from '../ui/slider';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowRight } from 'lucide-react';

export const RoiCalculator: React.FC<{ onCtaClick: () => void }> = ({ onCtaClick }) => {
    const [monthlyLeads, setMonthlyLeads] = useState(300);
    const [avgContractValue, setAvgContractValue] = useState(25000);

    // Calculations in Rupees (₹)
    const LeadEngineConversionBoost = 0.40;
    const currentConversions = Math.round(monthlyLeads * 0.10);
    const leadEngineConversions = Math.round(monthlyLeads * (0.10 * (1 + LeadEngineConversionBoost)));
    const additionalDeals = leadEngineConversions - currentConversions;
    const projectedAdditionalRevenue = additionalDeals * avgContractValue;
    const hoursSavedPerMonth = Math.round(monthlyLeads * 0.25);

    return (
        <section id="calculator" className="py-24 bg-white border-t border-b border-zinc-200 relative scroll-mt-20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
                    <Badge variant="subtle" className="bg-zinc-100 text-zinc-900 border-zinc-300 font-semibold">INTERACTIVE CALCULATOR</Badge>
                    <h2 className="text-3xl md:text-4xl font-black text-black">
                        Calculate Your Projected ROI
                    </h2>
                    <p className="text-zinc-600 text-sm">
                        See how much revenue LeadEngine can unlock by responding instantly to every WhatsApp inquiry.
                    </p>
                </div>

                <Card className="bg-white border-zinc-200 p-8 shadow-xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                        {/* Sliders Side */}
                        <div className="space-y-8">
                            <Slider
                                label="Monthly Inbound WhatsApp Leads"
                                valueDisplay={`${monthlyLeads.toLocaleString()} leads/mo`}
                                min={50}
                                max={2000}
                                step={50}
                                value={monthlyLeads}
                                onChange={(e) => setMonthlyLeads(Number(e.target.value))}
                            />

                            <Slider
                                label="Average Customer Contract Value (₹)"
                                valueDisplay={`₹${avgContractValue.toLocaleString('en-IN')}`}
                                min={5000}
                                max={200000}
                                step={2500}
                                value={avgContractValue}
                                onChange={(e) => setAvgContractValue(Number(e.target.value))}
                            />

                            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 space-y-1.5 font-mono shadow-xs">
                                <div>⏱️ Time saved: <span className="text-black font-bold">{hoursSavedPerMonth} hours/month</span></div>
                                <div>🚀 Lead capture rate: <span className="text-green-600 font-bold">100% Guaranteed</span></div>
                            </div>
                        </div>

                        {/* Revenue Output Side - High Contrast Minimalist Black & White */}
                        <div className="bg-black text-white rounded-2xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden border border-zinc-800">
                            <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Projected Additional Monthly Revenue</div>
                            
                            <div className="text-4xl md:text-5xl font-black font-mono tracking-tight text-white">
                                +₹{projectedAdditionalRevenue.toLocaleString('en-IN')}
                                <span className="text-sm font-sans font-normal text-zinc-400 block mt-1">/ month</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-zinc-800 text-xs">
                                <div>
                                    <div className="text-zinc-400 font-medium">Extra Deals / Mo</div>
                                    <div className="text-xl font-bold text-white font-mono mt-0.5">+{additionalDeals}</div>
                                </div>
                                <div>
                                    <div className="text-zinc-400 font-medium">Response Speed</div>
                                    <div className="text-xl font-bold text-white font-mono mt-0.5">&lt; 1.8s</div>
                                </div>
                            </div>

<Button
  onClick={onCtaClick}
  variant="default"
  size="lg"
  className="
    w-full
    h-12
    rounded-xl
    bg-gradient-to-r
    from-[#2563EB]
    to-[#3B82F6]
    text-white
    font-semibold
    transition-all
    duration-300
    hover:from-[#1D4ED8]
    hover:to-[#2563EB]
    hover:shadow-[0_0_40px_rgba(59,130,246,0.45)]
    shadow-[0_12px_30px_rgba(59,130,246,0.30)]
  "
>
  Unlock This Revenue Now
  <ArrowRight className="w-4 h-4 ml-2" />
</Button>
                        </div>
                    </div>
                </Card>
            </div>
        </section>
    );
};
