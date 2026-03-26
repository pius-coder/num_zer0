"use client";
import React, { useState } from 'react';
import { Star, ChevronDown, ChevronUp } from 'lucide-react';

const countriesData = [
    {
        name: "Australia",
        count: "18166 qty",
        minPrice: "30",
        fromLabel: "from $ 6",
        hasMulti: true,
        variants: [
            { qty: "Available 537 qty", price: "$ 30" },
            { qty: "Available 110 qty", price: "$ 15.63" }
        ],
        allPrices: 4
    },
    {
        name: "Belgium",
        count: "4538 qty",
        minPrice: "1",
        fromLabel: "",
        hasMulti: false,
        variants: []
    },
    {
        name: "France",
        count: "2072 qty",
        minPrice: "5.5",
        fromLabel: "from $ 2.8",
        hasMulti: true,
        variants: [
            { qty: "Available 20 qty", price: "$ 5.5" },
            { qty: "Available 20 qty", price: "$ 4.45" }
        ],
        allPrices: 4
    },
    {
        name: "USA",
        count: "15403 qty",
        minPrice: "5",
        fromLabel: "from $ 0.88",
        hasMulti: true,
        variants: [
            { qty: "Available 154 qty", price: "$ 5" },
            { qty: "Available 823 qty", price: "$ 3.13" }
        ],
        allPrices: 5
    },
    {
        name: "Indonesia",
        count: "33710 qty",
        minPrice: "0.62",
        fromLabel: "",
        hasMulti: false,
        variants: []
    }
];

export const CountrySelection = () => {
    return (
        <div className="services-list-section flex flex-col gap-4 mt-6">
            <div className="flex justify-between items-center">
                <div className="font-bold text-[18px]">
                    Country selection for <span className="text-[#fa7900]">Whatsapp</span>
                </div>
                <a href="/countries" className="text-sm font-semibold text-[#fa7900] hover:underline">
                    All countries
                </a>
            </div>

            <div>
                <input
                    type="text"
                    placeholder="Search by country"
                    autoComplete="off"
                    className="w-full bg-[#f5f5f5] rounded px-4 py-3 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#fa7900] focus:bg-white border-transparent focus:border-[#fa7900] transition-colors"
                />
            </div>

            <div className="flex items-center gap-6 border-b border-gray-200 pb-2 text-[14px] font-bold text-gray-400 cursor-pointer pt-2">
                <div className="flex items-center gap-1.5 text-[#22252d] border-b-2 border-[#22252d] pb-2 -mb-[10px]">
                    Top countries <ChevronDown className="w-[12px] h-[12px]" strokeWidth={4} />
                </div>
                <div className="flex items-center gap-1.5 hover:text-[#22252d] pb-2 -mb-[10px]">
                    Quantity <ChevronDown className="w-[12px] h-[12px] opacity-0" strokeWidth={4} />
                </div>
                <div className="flex items-center gap-1.5 hover:text-[#22252d] pb-2 -mb-[10px]">
                    Price <ChevronDown className="w-[12px] h-[12px] opacity-0" strokeWidth={4} />
                </div>
            </div>

            <div className="flex flex-col border border-[#e9e9e9] rounded-md overflow-hidden bg-white">
                {countriesData.map((co, idx) => (
                    <CountryRow key={idx} data={co} />
                ))}
            </div>
        </div>
    );
};

const CountryRow = ({ data }: { data: any }) => {
    const [open, setOpen] = useState(false);

    return (
        <div className={`border-b border-[#e9e9e9] last:border-b-0 transition-colors ${open ? 'bg-[#fcfcfc]' : 'hover:bg-gray-50'}`}>
            <div
                className={`flex items-center px-4 py-3 min-h-[64px] ${data.hasMulti ? 'cursor-pointer' : ''}`}
                onClick={() => data.hasMulti && setOpen(!open)}
            >
                <button className="flex-shrink-0 text-gray-300 hover:text-gray-400 mr-[14px] focus:outline-none">
                    <Star className="w-[18px] h-[18px] fill-transparent stroke-2" />
                </button>

                <div className="w-[32px] h-[32px] bg-[#f0f0f0] rounded mr-[14px] flex-shrink-0"></div>

                <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-baseline gap-1 md:gap-3 truncate">
                    <span className="font-[800] text-[15px] text-[#22252d]">{data.name}</span>
                    {data.fromLabel && <span className="text-[13px] font-[600] text-gray-500">{data.fromLabel}</span>}
                </div>

                <div className="hidden sm:flex text-[13px] font-[600] text-gray-500 w-[100px]">
                    {data.count}
                </div>

                <div className="flex-shrink-0 flex justify-end">
                    <button
                        onClick={(e) => { e.stopPropagation(); }}
                        className="bg-[#fa7900] hover:bg-[#e06d00] text-white font-[700] text-[14px] rounded px-3 h-[34px] min-w-[70px] shadow-sm transition-colors"
                    >
                        $ {data.minPrice}
                    </button>
                </div>
            </div>

            {data.hasMulti && open && (
                <div className="w-full bg-[#fcfcfc] text-[13px] border-t border-[#e9e9e9]">
                    <table className="w-full text-left">
                        <thead className="text-[12px] text-gray-500 font-semibold border-b border-[#e9e9e9]">
                            <tr>
                                <td className="py-2.5 pl-[64px] md:pl-[120px]">Quantity</td>
                                <td className="py-2.5 pr-4 text-right w-[100px]">Price</td>
                            </tr>
                        </thead>
                        <tbody>
                            {data.variants.map((v: any, i: number) => (
                                <tr key={i} className="border-b border-[#e9e9e9] last:border-b-0 hover:bg-white">
                                    <td className="py-3 pl-[64px] md:pl-[120px] font-semibold text-[#555]">{v.qty}</td>
                                    <td className="py-3 pr-4 text-right">
                                        <button className="bg-[#fa7900] hover:bg-[#e06d00] text-white font-[700] text-[13px] rounded h-[32px] px-3 min-w-[70px] shadow-sm transition-colors">
                                            {v.price}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {data.allPrices > data.variants.length && (
                        <div className="w-full text-center py-3 bg-[#f5f5f5] text-[13px] font-[800] text-[#22252d] cursor-pointer hover:text-[#fa7900] flex justify-center items-center gap-2 group transition-colors border-t border-[#e9e9e9]">
                            All prices <span className="text-[#fa7900]">{data.allPrices}</span>
                            <ChevronDown className="w-[14px] h-[14px] text-[#22252d] group-hover:text-[#fa7900] transition-colors" strokeWidth={3} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
