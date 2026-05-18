import {describe, expect, it} from '@jest/globals';
import {example} from "../src/example";

describe("something", () => {
    it("should work", () => {
        expect(example()).toBe("Beispiel");
    });
});
