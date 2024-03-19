export function roundNumericValues<T>(obj: T): T {
  const roundValue = (value: number): number => {
    const rounded = Math.round(value * 100) / 100;

    if (Number.isInteger(rounded)) {
      return rounded;
    }
    return parseFloat(rounded.toFixed(2));
  };

  const roundObject = (input: any): any => {
    if (typeof input === "object" && input !== null) {
      for (const key in input) {
        if (typeof input[key] === "number") {
          input[key] = roundValue(input[key]);
        } else if (typeof input[key] === "object") {
          input[key] = roundObject(input[key]);
        }
      }
    }
    return input;
  };

  return roundObject(obj) as T;
}
