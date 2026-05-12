import { describe, expect, it } from '@jest/globals';
import { parseIso8601DurationToHours, extractNumericEnumValue } from "../src/utils";
import { JTFClientDefinitionProperty } from '../src/jtf';

describe("test ISO8601 Duration Parsing", () => {
    it("should parse valid time duration", () => {
        expect(parseIso8601DurationToHours("PT12H30M36S")).toBe(12.51);
        expect(parseIso8601DurationToHours("PT24M")).toBe(0.4);
    });

    it("should return null on invalid duration", () => {
        expect(parseIso8601DurationToHours("12H30M36S")).toBe(null);
        expect(parseIso8601DurationToHours("PT12")).toBe(null);
    });
});


describe("test extract numeric enum value", () => {
    it("should parse year enum property", () => {
        const propertyDefinitions: JTFClientDefinitionProperty[] = [
            {id: 'year', type: 'enum', selectedItem: 'YEAR-2025'}
        ];

        const propertyDefinitionsInvalid1: JTFClientDefinitionProperty[] = [
            {id: 'other', type: 'enum', selectedItem: 'YEAR-2025'}
        ];

        const propertyDefinitionsInvalid2: JTFClientDefinitionProperty[] = [
            { id: 'year', type: 'enum', selectedItem: 'OTHER-2025' }
        ];
        expect(extractNumericEnumValue(propertyDefinitions, 'year', /YEAR-([0-9]+)/, 0)).toBe(2025);
        expect(extractNumericEnumValue(propertyDefinitionsInvalid1, 'year', /YEAR-([0-9]+)/, 0)).toBe(0); // expect default on invalid
        expect(extractNumericEnumValue(propertyDefinitionsInvalid2, 'year', /YEAR-([0-9]+)/, 0)).toBe(0); // expect default on invalid
    });
});
