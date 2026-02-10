from difflib import SequenceMatcher
import logging

class FuzzyMatcher:
    def __init__(self):
        self.logger = logging.getLogger(__name__)

    def find_best_match_index_difflib(self, lines, query, threshold=0.6):
        if not isinstance(lines, list):
            raise ValueError('Invalid input: lines must be a list')

        try:
            best_idx = -1
            lineno = -1 
            best_score = threshold

            for idx, line in enumerate(lines):
                matcher = SequenceMatcher(None, query, line)
                score = matcher.ratio()
                print(f"Comparing query '{query}' with line '{line}' (index={idx})")

                if score >= threshold and score > best_score:
                    best_score = score
                    best_idx = idx
                    lineno = idx + 1  # 1-based line number                

            if best_idx >= 0:
                print(
                    f"difflib BEST match @{best_idx} (score={best_score:.3f})"
                )
            else:
                print(
                    f"No difflib match above threshold={threshold}"
                )

            return best_idx,lineno
        except Exception as error:
            print(
                f"Error in find_best_match_index_difflib (threshold={threshold}): {error}",
                exc_info=True
            )
            raise RuntimeError('Failed to perform fuzzy search (difflib)') from error


# Example usage:
matcher = FuzzyMatcher()
lines = ["apple pie", "banana bread", "cherry tart"]


query = "banana"
result = matcher.find_best_match_index_difflib(lines, query)
print("Best Match Index:", result)
