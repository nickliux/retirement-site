"use client"
import React, { useEffect, useState } from 'react';
import Decimal from 'decimal.js';

const RothOutputs = ({ inputs, inputs1 }) => {
    const findRmdByYear = (details, year) => {
        const detail = details.find((detail) => detail.year === year);
        return detail ? detail.rmd : "0.00"; // Default to "0.00" if no detail found for that year
    };
    //RMD calculations
    const { age1, age2, le1, le2, ira1, ira2, roi } = inputs1;

    const [iraDetails, setIraDetails] = useState({
        spouse1: [],
        spouse2: []
    });

    const [totals, setTotals] = useState({
        totalRMDsHusband: new Decimal(0),
        totalRMDsWife: new Decimal(0),
        inheritedIRAHusband: new Decimal(0),
        inheritedIRAWife: new Decimal(0)
    });

    const rmdDistributionTable = {
        75: 24.6,
        76: 23.7,
        77: 22.9,
        78: 22.0,
        79: 21.1,
        80: 20.2,
        81: 19.4,
        82: 18.5,
        83: 17.7,
        84: 16.8,
        85: 16.0,
        86: 15.2,
        87: 14.4,
        88: 13.7,
        89: 12.9,
        90: 12.2,
        91: 11.5,
        92: 10.8,
        93: 10.1,
        94: 9.5,
        95: 8.9,
        96: 8.4,
        97: 7.8,
        98: 7.3,
        99: 6.8,
        100: 6.4,
        101: 6.0,
        102: 5.6,
        103: 5.2,
        104: 4.9,
        105: 4.6,
        106: 4.3,
        107: 4.1,
        108: 3.9,
        109: 3.7,
        110: 3.5,
        111: 3.4,
        112: 3.3,
        113: 3.1,
        114: 3.0,
        115: 2.9,
        116: 2.8,
        117: 2.7,
        118: 2.5,
        119: 2.3,
        120: 2.0
    };

    const calculateRMD = (age, startingValue) => {
        if (age < 75) return new Decimal(0); // RMD is 0 for ages below 75
        const distributionPeriod = rmdDistributionTable[age];
        return distributionPeriod ? new Decimal(startingValue).dividedBy(distributionPeriod) : new Decimal(0);
    };

    useEffect(() => {
        const calculateIraDetails = (startingAge, lifeExpectancy, currentIraValue) => {
            let year = new Date().getFullYear();
            let age = startingAge;
            let startingValue = new Decimal(currentIraValue);
            const details = [];

            while (age <= lifeExpectancy) {
                const investmentReturns = startingValue.times(Decimal(roi).dividedBy(100));
                const rmd = calculateRMD(age, startingValue);
                const endingValue = startingValue.plus(investmentReturns).minus(rmd); // SUBTRACT ROTH LATER

                details.push({
                    year,
                    age,
                    startingValue: startingValue.toFixed(2),
                    investmentReturns: investmentReturns.toFixed(2),
                    rmd: rmd.toFixed(2),
                    endingValue: endingValue.toFixed(2)
                });
                startingValue = endingValue;
                age++;
                year++;
            }

            return details;
        };

        const spouse1Details = calculateIraDetails(age1, le1, ira1);
        const spouse2Details = calculateIraDetails(age2, le2, ira2);

        setIraDetails({
            spouse1: spouse1Details,
            spouse2: spouse2Details
        });

        const totalRMDsHusband = spouse1Details.reduce((total, detail) => total.plus(new Decimal(detail.rmd)), new Decimal(0));
        const totalRMDsWife = spouse2Details.reduce((total, detail) => total.plus(new Decimal(detail.rmd)), new Decimal(0));

        const inheritedIRAHusband = new Decimal(spouse1Details[spouse1Details.length - 1]?.endingValue || 0);
        const inheritedIRAWife = new Decimal(spouse2Details[spouse2Details.length - 1]?.endingValue || 0);

        setTotals({
            totalRMDsHusband,
            totalRMDsWife,
            inheritedIRAHusband,
            inheritedIRAWife
        });


    }, [age1, age2, le1, le2, ira1, ira2, roi]); // Recalculate when inputs change
// RMD CALCULATIONS END ----------------

// ROTH CALCULATIONS START -----------
    const currentYear = new Date().getFullYear();
    const maxLifeExpectancy = Math.max(le1, le2);

    // Initial state setup for editable fields.
    // You can also use inputs to pre-populate this state if they should start with values.
    const [editableFields, setEditableFields] = useState(() => {
        const fields = {};
        for (let year = currentYear; year <= currentYear + (maxLifeExpectancy - Math.min(age1, age2)); year++) {
            fields[year] = {
                rothSpouse1: 0,
                rothSpouse2: 0,
                salarySpouse1: 0,
                salarySpouse2: 0,
                rentalIncome: 0,
                interestDividendIncome: 0,
                shortTermCapitalGains: 0,
                pension: 0
            };
        }
        return fields;
    });

    // Static fields calculated once based on life expectancies
    const staticFields = {};
    for (let year = currentYear, ageSpouse1 = age1, ageSpouse2 = age2;
         year <= currentYear + maxLifeExpectancy - Math.min(age1, age2);
         year++, ageSpouse1++, ageSpouse2++) {
        staticFields[year] = {
            year: year,
            ageSpouse1: ageSpouse1,
            ageSpouse2: ageSpouse2,
            // Add other static calculations here if needed, such as RMDs, Social Security, etc.
        };
    }

    // Handler for changes in the editable fields
    const handleEditableFieldChange = (year, field, value) => {
        setEditableFields(prev => ({
            ...prev,
            [year]: {
                ...prev[year],
                [field]: Decimal(value) // Convert input value to a Decimal
            }
        }));
    };

    // Function to render editable field inputs with improved styling
    const renderEditableFieldInput = (year, field) => {
        return (
            <input
                type="text"
                className="w-full p-1 border border-gray-300 rounded text-right"
                value={editableFields[year][field]} // Show values as fixed-point notation
                onChange={(e) => handleEditableFieldChange(year, field, e.target.value)}
            />
        );
    };



    return (
        <div>

            <h2 className="text-xl font-semibold mb-3">Financial Plan Details</h2>
            <table className="min-w-full table-fixed border-collapse border border-slate-400">
                <thead className="bg-gray-100">
                <tr>
                    <th className="p-2 border border-slate-300">Year</th>
                    <th className="p-2 border border-slate-300">Age Spouse 1</th>
                    <th className="p-2 border border-slate-300">Age Spouse 2</th>
                    <th className="p-2 border border-slate-300">Roth Conversion 1</th>
                    <th className="p-2 border border-slate-300">Roth Conversion 2</th>
                    <th className="p-2 border border-slate-300">Salary 1</th>
                    <th className="p-2 border border-slate-300">Salary 2</th>
                    <th className="p-2 border border-slate-300">Rental Income</th>
                    <th className="p-2 border border-slate-300">Interest / Dividend</th>
                    <th className="p-2 border border-slate-300">Capital Gains</th>
                    <th className="p-2 border border-slate-300">Pension</th>
                    <th className="p-2 border border-slate-300">RMD Spouse 1</th>
                    <th className="p-2 border border-slate-300">RMD Spouse 2</th>

                </tr>
                </thead>
                <tbody>
                {Object.keys(staticFields).map((year) => (
                    <tr key={year}>
                        <td className="p-2 border border-slate-300 text-center">{year}</td>
                        <td className="p-2 border border-slate-300 text-center">{staticFields[year].ageSpouse1}</td>
                        <td className="p-2 border border-slate-300 text-center">{staticFields[year].ageSpouse2}</td>
                        <td className="p-2 border border-slate-300">{renderEditableFieldInput(year, 'rothSpouse1')}</td>
                        <td className="p-2 border border-slate-300">{renderEditableFieldInput(year, 'rothSpouse2')}</td>
                        <td className="p-2 border border-slate-300">{renderEditableFieldInput(year, 'salary1')}</td>
                        <td className="p-2 border border-slate-300">{renderEditableFieldInput(year, 'salary2')}</td>
                        <td className="p-2 border border-slate-300">{renderEditableFieldInput(year, 'rentalIncome')}</td>
                        <td className="p-2 border border-slate-300">{renderEditableFieldInput(year, 'interest')}</td>
                        <td className="p-2 border border-slate-300">{renderEditableFieldInput(year, 'capitalGains')}</td>
                        <td className="p-2 border border-slate-300">{renderEditableFieldInput(year, 'pension')}</td>
                        <td className="p-2 border border-slate-300 text-right">{findRmdByYear(iraDetails.spouse1, parseInt(year))}</td>
                        <td className="p-2 border border-slate-300 text-right">{findRmdByYear(iraDetails.spouse2, parseInt(year))}</td>

                    </tr>
                ))}
                </tbody>
            </table>





            {/*RMD TABLES */}

            <div className="totals-display">
                <div className="total-rmds">
                    <h2>Total RMDs</h2>
                    <div>Husband: ${totals.totalRMDsHusband.toFixed(2)}</div>
                    <div>Wife: ${totals.totalRMDsWife.toFixed(2)}</div>
                    <div>Total: ${(totals.totalRMDsHusband.plus(totals.totalRMDsWife)).toFixed(2)}</div>
                </div>
                <div className="inherited-iras">
                    <h2>Inherited Pre-Tax IRA</h2>
                    <div>Husband: ${totals.inheritedIRAHusband.toFixed(2)}</div>
                    <div>Wife: ${totals.inheritedIRAWife.toFixed(2)}</div>
                    <div>Total: ${(totals.inheritedIRAHusband.plus(totals.inheritedIRAWife)).toFixed(2)}</div>
                </div>
            </div>

            <h2 className="text-xl font-semibold mb-3">Spouse 1 IRA Details</h2>
            <table className="min-w-full table-auto border-collapse border border-slate-400">
                <thead>
                <tr>
                    <th className="border border-slate-300">Year</th>
                    <th className="border border-slate-300">Age</th>
                    <th className="border border-slate-300">Starting Value</th>
                    <th className="border border-slate-300">Investment Returns</th>
                    <th className="border border-slate-300">RMD</th>
                    <th className="border border-slate-300">Ending Value</th>
                </tr>
                </thead>
                <tbody>
                {iraDetails.spouse1.map((detail, index) => (
                    <tr key={index}>
                        <td className="border border-slate-300 text-center">{detail.year}</td>
                        <td className="border border-slate-300 text-center">{detail.age}</td>
                        <td className="border border-slate-300 text-right">${detail.startingValue}</td>
                        <td className="border border-slate-300 text-right">${detail.investmentReturns}</td>
                        <td className="border border-slate-300 text-right">${detail.rmd}</td>
                        <td className="border border-slate-300 text-right">${detail.endingValue}</td>
                    </tr>
                ))}
                </tbody>
            </table>

            <h2 className="text-xl font-semibold mb-3 mt-5">Spouse 2 IRA Details</h2>
            <table className="min-w-full table-auto border-collapse border border-slate-400">
                <thead>
                <tr>
                    <th className="border border-slate-300">Year</th>
                    <th className="border border-slate-300">Age</th>
                    <th className="border border-slate-300">Starting Value</th>
                    <th className="border border-slate-300">Investment Returns</th>
                    <th className="border border-slate-300">RMD</th>
                    <th className="border border-slate-300">Ending Value</th>
                </tr>
                </thead>
                <tbody>
                {iraDetails.spouse2.map((detail, index) => (
                    <tr key={index}>
                        <td className="border border-slate-300 text-center">{detail.year}</td>
                        <td className="border border-slate-300 text-center">{detail.age}</td>
                        <td className="border border-slate-300 text-right">${detail.startingValue}</td>
                        <td className="border border-slate-300 text-right">${detail.investmentReturns}</td>
                        <td className="border border-slate-300 text-right">${detail.rmd}</td>
                        <td className="border border-slate-300 text-right">${detail.endingValue}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );

};

export default RothOutputs;
