import { random, shuffle } from 'lodash';

export function generateSuggestionsRandomly(
  shuffles: string[],
  unacceptableShuffles: string[],
  suggestionsCount = 3,
): string[] {
  const shuffleSymbols = ['_', '']; // Define symbols to include in shuffle
  const suggestions = []; // Initialize array to hold valid suggestions
  let suggestionIndex = 0; // Initialize index to track the number of suggestions generated

  // Loop until the desired number of suggestions is generated
  while (suggestionIndex < suggestionsCount) {
    const randomNumber = random(1, 10000); // Generate a random number between 1 and 10000
    const shuffleSuggestions = shuffle([
      // Create a shuffled array with given shuffles, random number, and symbols
      ...shuffles,
      ...shuffleSymbols,
      randomNumber.toString(),
    ]);

    // Form a suggestion by combining the first three elements of the shuffled array
    const suggestion = shuffleSuggestions.slice(0, 3).join('').replace(' ', '');

    // Check if the suggestion is valid (length and not in unacceptable list)
    if (
      suggestion.length >= 8 &&
      unacceptableShuffles.includes(suggestion) === false
    ) {
      suggestions.push(suggestion); // Add valid suggestion to the array
      suggestionIndex++; // Increment the suggestion index
    }
  }

  return suggestions; // Return the array of generated suggestions
}
