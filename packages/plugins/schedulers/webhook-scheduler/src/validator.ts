// Reference: https://github.com/trpc/trpc/tree/v10.45.2
// trpc/trpc/packages/server/src/core/parser.ts

export type ValidatorCustom<TOutput> = (
	input: unknown
) => Promise<TOutput> | TOutput;

export type ValidatorZodLike<TOutput> = {
	_output: TOutput;
	parseAsync?: (input: unknown) => Promise<TOutput>;
	parse?: (input: unknown) => TOutput;
};

export type Validator<TOutput> =
	| ValidatorCustom<TOutput>
	| ValidatorZodLike<TOutput>;

export type ValidationFn<TOutput> = (
	input: unknown
) => Promise<TOutput> | TOutput;

export const getValidationFn = <TOutput>(validator: Validator<TOutput>) => {
	if (typeof validator === "function") {
		return validator;
	}
	if (validator.parseAsync) {
		return validator.parseAsync;
	}
	if (validator.parse) {
		return validator.parse;
	}
	throw new Error("Invalid validator");
};
