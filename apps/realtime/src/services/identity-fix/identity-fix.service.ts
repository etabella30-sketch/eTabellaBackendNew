import { Injectable } from '@nestjs/common';

@Injectable()
export class IdentityFixService {
    /**
     * values: Array<[number, boolean?]>
     * Example: [[807607293607200],[807607308664300],[807607331119500,true],...]
     */

    /** Validate: numbers, unique, strictly ascending. Never mutates. */
    validateValues(values) {
        const errors = [];
        const seen = new Set();

        for (let i = 0; i < values.length; i++) {
            const entry = values[i];
            if (!Array.isArray(entry) || entry.length === 0) {
                errors.push(`Index ${i}: entry must be [identity, optionalBoolean]`);
                continue;
            }
            const [id] = entry;

            if (typeof id !== "number" || !Number.isFinite(id)) {
                errors.push(`Index ${i}: identity must be a finite number`);
                continue;
            }
            if (!Number.isSafeInteger(id)) {
                errors.push(`Index ${i}: identity ${id} is not a safe integer`);
            }
            if (seen.has(id)) {
                errors.push(`Index ${i}: duplicate identity ${id}`);
            }
            seen.add(id);

            if (i > 0) {
                const [prevId] = values[i - 1];
                if (!(id > prevId)) {
                    errors.push(
                        `Index ${i}: identity ${id} is not greater than previous ${prevId}`
                    );
                }
            }
        }

        return { ok: errors.length === 0, errors };
    }

    /**
     * Attempt to fix only non-fixed entries by minimally bumping them up so the
     * sequence is strictly increasing. Never changes fixed ones. Never reorders.
     * Returns { ok, values, error? }
     */
    attemptFix(values) {
        // shallow copy and normalize the fixed flag to boolean
        const out = values.map(v => [v[0], v[1] === true]);
        const n = out.length;

        // Precompute the next fixed identity to the right for each index
        const nextFixedId = new Array(n).fill(Infinity);
        let next = Infinity;
        for (let i = n - 1; i >= 0; i--) {
            const [id, fixed] = out[i];
            if (fixed) next = id;
            nextFixedId[i] = next;
        }

        // Forward pass: enforce strictly increasing, only bump non-fixed
        for (let i = 0; i < n; i++) {
            const [id, fixed] = out[i];
            const prevId = i === 0 ? -Infinity : out[i - 1][0];

            if (fixed) {
                // If a fixed entry violates order vs previous, we cannot fix.
                if (!(id > prevId)) {
                    return {
                        ok: false,
                        error: `Fixed id at index ${i} (${id}) is not greater than previous (${prevId}). Cannot change a fixed id.`,
                        values: out
                    };
                }
                continue;
            }

            // Non-fixed: minimally bump to be > prevId
            let newId = Math.max(id, (Number.isFinite(prevId) ? prevId : -Infinity) + 1);

            // Must remain below the next fixed anchor (if any)
            if (!(newId < nextFixedId[i])) {
                return {
                    ok: false,
                    error: `Cannot assign a valid id at index ${i} without reaching or exceeding next fixed id ${nextFixedId[i]}.`,
                    values: out
                };
            }
            // Ensure safe integer
            if (!Number.isSafeInteger(newId)) {
                return {
                    ok: false,
                    error: `Computed id ${newId} at index ${i} is not a safe integer.`,
                    values: out
                };
            }
            out[i][0] = newId;
        }

        // Final sanity check
        const { ok, errors } = this.validateValues(out);
        if (!ok) {
            return { ok: false, error: errors.join("; "), values: out };
        }
        return { ok: true, values: out };
    }

    /* ---------------- Example ----------------
    const values = [
      [807607293607200],
      [807607308664300],
      [807607331119500, true],
      [807607331119500],          // duplicate + not increasing -> will be bumped
      [807607360000000, true],
      [807607350000000],          // not increasing vs fixed -> may fail or bump
      [807607380000000]
    ];
    
    const check = validateValues(values);
    console.log("valid?", check.ok, check.errors);
    
    const fixed = attemptFix(values);
    console.log("fixable?", fixed.ok, fixed.error || "");
    console.log(fixed.values);
    ------------------------------------------- */


}
