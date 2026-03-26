"use client";
import React from 'react';
import { ServiceSelection } from './ServiceSelection';
import { CountrySelection } from './CountrySelection';

export const LanguagesList = () => {
    return (
        <section id="languagesList" className="flex flex-col gap-6">
            <ServiceSelection />
            <CountrySelection />
        </section>
    );
};



