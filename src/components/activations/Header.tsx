"use client";
import React from 'react';
import { ChevronDown, Menu } from 'lucide-react';

export const Header = () => {
    return (
        <header className="w-full shadow-[0_4px_8px_rgba(0,0,0,0.06)] bg-white sticky top-0 z-50">
            {/* Top Header */}
            <div className="h-[64px] border-b border-gray-100">
                <div className="max-w-[1400px] mx-auto px-4 lg:px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <a href="/" className="font-bold text-[24px]">Grizzly<span className="text-[#fa7900]">SMS</span></a>

                        <nav className="hidden lg:flex items-center gap-6 font-[600] text-[16px]">
                            <a href="/price" className="hover:text-[#fa7900] transition-colors">Price</a>
                            <a href="/docs" className="hover:text-[#fa7900] transition-colors">API</a>
                            <a href="/faq" className="hover:text-[#fa7900] transition-colors">FAQ</a>
                            <a href="/profit" className="hover:text-[#fa7900] transition-colors">Earn with us</a>
                            <a href="/refer" className="hover:text-[#fa7900] transition-colors">Affiliate programs</a>
                            <div className="flex items-center gap-1 hover:text-[#fa7900] cursor-pointer transition-colors">
                                Software <ChevronDown className="w-4 h-4" />
                            </div>
                        </nav>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer font-[600] text-[14px]">
                            <div className="w-5 h-5 bg-gray-200 rounded-sm"></div>
                            English <ChevronDown className="w-4 h-4 opacity-50" strokeWidth={3} />
                        </div>

                        <button className="hidden md:flex p-2 hover:bg-gray-50 rounded">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M7.31505 3.51824L9.99992 0.833374L12.6848 3.51824H16.4817V7.31519L19.1666 10L16.4817 12.6849V16.4819H12.6848L9.99992 19.1667L7.31507 16.4819H3.51811V12.6849L0.833252 10L3.51811 7.31519V3.51824H7.31505ZM14.9999 10C14.9999 12.7615 12.7613 15 9.99992 15V5.00004C12.7613 5.00004 14.9999 7.23862 14.9999 10Z" fill="#FB7800"></path></svg>
                        </button>

                        <button className="flex lg:hidden p-2 hover:bg-gray-50 rounded">
                            <Menu className="w-6 h-6 text-[#22252d]" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Desktop Bottom Header (Hidden on Mobile) */}
            <div className="hidden lg:flex h-[52px] bg-white border-b border-gray-100">
                <div className="container mx-auto px-6 h-full flex items-center justify-between text-[14px] font-[600]">
                    <div className="flex items-center gap-6 text-[#1c1f27]">
                        <a href="#" className="hover:text-[#fa7900] transition-colors">Received numbers</a>
                        <a href="#" className="hover:text-[#fa7900] transition-colors">Query statistics</a>
                        <a href="#" className="hover:text-[#fa7900] transition-colors">Balance history</a>
                        <a href="#" className="hover:text-[#fa7900] transition-colors">Settings</a>
                        <a href="#" className="hover:text-[#fa7900] transition-colors">Referral program</a>
                    </div>

                    <div className="flex items-center gap-6">
                        <span className="text-gray-500">tuek****@gmail.com</span>
                        <div className="flex items-center gap-2">
                            <span className="font-[800]">Balance:</span>
                            <span className="font-[800] text-[#22252d]">$ 0</span>
                            <button className="ml-2 bg-[#fa7900] text-white px-3 py-1.5 rounded text-[13px] hover:bg-[#e06d00] transition-colors">Top Up balance</button>
                        </div>
                        <button className="text-gray-500 hover:text-red-500 transition-colors">Log Out</button>
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Header */}
            <div className="flex lg:hidden bg-white border-b border-gray-100 p-3 justify-center text-[15px] font-[800]">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-200"></div>
                    <span>Profile</span>
                    <span className="ml-2">$ 0</span>
                    <ChevronDown className="w-4 h-4 ml-1" strokeWidth={3} />
                </div>
            </div>
        </header>
    );
};
