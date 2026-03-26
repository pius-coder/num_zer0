"use client";
import React from 'react';
import { Search } from 'lucide-react';

const services = [
    { id: 1, name: "Whatsapp", selected: true },
    { id: 2, name: "Telegram", selected: false },
    { id: 3, name: "Google, Gmail, Youtube", selected: false },
    { id: 4, name: "facebook", selected: false },
    { id: 5, name: "AnyOther", selected: false },
    { id: 6, name: "Claude", selected: false },
    { id: 7, name: "Amazon", selected: false },
    { id: 8, name: "Instagram + Threads", selected: false },
    { id: 9, name: "Flipkard", selected: false },
    { id: 10, name: "TikTok", selected: false },
    { id: 11, name: "Apple", selected: false },
    { id: 12, name: "RailOne (ex-SwaRail)", selected: false }
];

export const ServiceSelection = () => {
    return (
        <div className="languages-list-section flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <div className="font-bold text-[18px]">Service selection</div>
                <a href="/services" className="text-sm font-semibold text-[#fa7900] hover:underline">
                    All services
                </a>
            </div>

            <div className="relative">
                <div className="flex items-center w-full bg-[#f5f5f5] rounded py-[10px] px-3">
                    <div className="flex flex-1 items-center gap-3">
                        <div className="bg-white p-1 rounded border shadow-sm">
                            <div className="w-[30px] h-[30px] bg-gray-200 rounded"></div>
                        </div>
                        <span className="font-semibold text-[15px]">Whatsapp</span>
                    </div>
                    <div className="text-gray-400 text-sm font-medium flex items-center gap-1 cursor-pointer">
                        <span>Search</span>
                        <span>(2 411)</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {services.map((svc) => (
                    <a
                        key={svc.id}
                        href="#"
                        className={`flex items-center gap-3 p-2 rounded-md transition-colors border ${svc.selected ? 'border-[#fa7900] bg-[#fff6ec]' : 'border-transparent hover:bg-gray-100'}`}
                    >
                        <div className="w-[46px] h-[46px] bg-white rounded-md border shadow-sm flex items-center justify-center shrink-0">
                            <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                        </div>
                        <span className={`text-[14px] leading-tight ${svc.selected ? 'font-[800]' : 'font-semibold text-gray-600'}`}>{svc.name}</span>
                    </a>
                ))}
            </div>
        </div>
    );
};
