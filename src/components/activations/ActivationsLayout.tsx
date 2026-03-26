"use client";
import React from 'react';
import { Header } from './Header';

export const ActivationsLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="flex flex-col min-h-screen bg-white text-[#22252d] font-sans">
            <Header />
            <main className="flex-1">
                <div className="container mx-auto px-4 md:px-0">
                    <div className="grid grid-cols-12 gap-4 mt-6">
                        <div className="col-span-12 lg:col-span-5 pb-24">
                            {children}
                        </div>
                        {/* The remaining 7 columns are left empty/flexible per the provided HTML references (col-span-5 used for activations) */}
                    </div>
                </div>
            </main>
        </div>
    );
};
