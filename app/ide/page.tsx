"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Badge, Card } from "@/components/ui";
import { AuthGuard } from "@/components/AuthGuard";
import { applyAuthHeaders } from "@/lib/session";
import { 
  Play, 
  Lightbulb, 
  Terminal, 
  CheckCircle2, 
  XCircle, 
  ListChecks, 
  ChevronDown, 
  Clock, 
  Zap, 
  Trophy,
  Sparkles,
  Code2,
  FlaskConical,
  Keyboard,
  RotateCcw
} from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

// 20 Creative Python Challenges
const challenges = [
  {
    id: "1",
    tag: "Cipher",
    difficulty: 1,
    title: "Caesar Cipher",
    description: "You intercepted a secret message! Build a Caesar cipher encoder that shifts each letter by a given amount.",
    criteria: "caesar('hello', 3) returns 'khoor'. Wrap around z→a. Keep non-alpha chars unchanged. Case-sensitive.",
    mentorInstructions: "Explain character codes with ord()/chr(). Guide modular arithmetic for wrapping. Never give full solution.",
    rubric: "Function caesar(text, shift) must shift letters correctly, wrap at z/Z, preserve case and non-alpha chars.",
    steps: [
      "Define `caesar(text, shift)` function",
      "Iterate through each character in the text",
      "Use ord() and chr() to shift letters, wrapping with modulo 26",
      "Preserve case and leave non-letter characters unchanged",
    ],
    starterCode: `def caesar(text, shift):\n    # Encrypt the message by shifting each letter\n    pass\n\n# Test it:\nprint(caesar("hello", 3))  # Expected: khoor\nprint(caesar("Attack at Dawn!", 5))  # Expected: Fyyfhp fy Ifbs!`,
    expectedOutput: "khoor",
    retryHelp: "Use ord('a') as base. new_pos = (ord(ch) - base + shift) % 26. Then chr(base + new_pos).",
  },
  {
    id: "2",
    tag: "Simulation",
    difficulty: 2,
    title: "Collatz Conjecture",
    description: "The mystery no mathematician can prove! Given a number, if even → halve it, if odd → triple it + 1. Count steps to reach 1.",
    criteria: "collatz_steps(6) returns 8 (6→3→10→5→16→8→4→2→1). Return 0 for n=1.",
    mentorInstructions: "Explain the conjecture's unsolved status. Guide through while loop logic. Never give full answer.",
    rubric: "Function collatz_steps(n) must return exact step count to reach 1.",
    steps: [
      "Define `collatz_steps(n)` function",
      "Use a while loop that continues until n equals 1",
      "If n is even, divide by 2; if odd, multiply by 3 and add 1",
      "Count and return the number of steps",
    ],
    starterCode: `def collatz_steps(n):\n    # How many steps to reach 1?\n    pass\n\n# Test it:\nprint(collatz_steps(6))   # Expected: 8\nprint(collatz_steps(27))  # Expected: 111 (surprisingly long!)`,
    expectedOutput: "8",
    retryHelp: "steps = 0. While n != 1: if n%2==0 then n//=2 else n = 3*n+1. Increment steps each loop.",
  },
  {
    id: "3",
    tag: "Puzzle",
    difficulty: 2,
    title: "Digital Root",
    description: "Keep summing the digits of a number until you get a single digit. This ancient trick reveals hidden patterns in numbers!",
    criteria: "digital_root(942) returns 6 (9+4+2=15, 1+5=6). digital_root(0) returns 0.",
    mentorInstructions: "Can be solved iteratively or with the math trick (1 + (n-1)%9). Guide the iterative approach first.",
    rubric: "Function digital_root(n) must return a single-digit result by recursively summing digits.",
    steps: [
      "Define `digital_root(n)` function",
      "While the number has more than one digit, sum its digits",
      "Return the final single digit",
    ],
    starterCode: `def digital_root(n):\n    # Reduce to a single digit\n    pass\n\n# Test it:\nprint(digital_root(942))    # Expected: 6\nprint(digital_root(132189))  # Expected: 6\nprint(digital_root(0))       # Expected: 0`,
    expectedOutput: "6",
    retryHelp: "While n >= 10: n = sum of its digits. Or use the shortcut: 0 if n==0 else 1 + (n-1) % 9.",
  },
  {
    id: "4",
    tag: "Encryption",
    difficulty: 2,
    title: "Morse Code Translator",
    description: "Build a translator that converts English text to Morse code — dots and dashes that once connected the world.",
    criteria: "to_morse('SOS') returns '... --- ...'. Use ' ' between letters and ' / ' between words. Uppercase input.",
    mentorInstructions: "Provide the Morse dictionary idea. Guide through string joining. Never give full solution.",
    rubric: "Function to_morse(text) must correctly map each letter/digit to Morse, space-separated, with / for word gaps.",
    steps: [
      "Define `to_morse(text)` function with a Morse code dictionary",
      "Convert input to uppercase and iterate through each character",
      "Map each character to its Morse code equivalent",
      "Join letters with spaces and separate words with ' / '",
    ],
    starterCode: `def to_morse(text):\n    MORSE = {\n        'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.',\n        'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---',\n        'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---',\n        'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-',\n        'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--',\n        'Z': '--..', '0': '-----', '1': '.----', '2': '..---',\n        '3': '...--', '4': '....-', '5': '.....', '6': '-....',\n        '7': '--...', '8': '---..', '9': '----.',\n    }\n    # Translate text to Morse code\n    pass\n\n# Test it:\nprint(to_morse("SOS"))       # Expected: ... --- ...\nprint(to_morse("HELLO WORLD"))`,
    expectedOutput: "... --- ...",
    retryHelp: "Split text into words → for each word convert each letter → join letters with ' ', join words with ' / '.",
  },
  {
    id: "5",
    tag: "Math",
    difficulty: 1,
    title: "FizzBuzz Generator",
    description: "The classic interview destroyer! Return a list where multiples of 3 are 'Fizz', multiples of 5 are 'Buzz', both are 'FizzBuzz'.",
    criteria: "fizzbuzz(15) returns list of 15 items. fizzbuzz(15)[14] == 'FizzBuzz'. Numbers stay as strings.",
    mentorInstructions: "Guide through modulo checks. Order matters — check 15 (both) before 3 or 5 individually.",
    rubric: "Function fizzbuzz(n) must return list of length n with correct Fizz/Buzz/FizzBuzz/number strings.",
    steps: [
      "Define `fizzbuzz(n)` function",
      "Loop from 1 to n (inclusive)",
      "Check divisibility by both 3 and 5 first, then 3, then 5",
      "Append the appropriate string (or the number as string) to result list",
    ],
    starterCode: `def fizzbuzz(n):\n    # Generate the legendary FizzBuzz sequence\n    pass\n\n# Test it:\nresult = fizzbuzz(15)\nprint(result)  # ['1','2','Fizz','4','Buzz',...,'FizzBuzz']`,
    expectedOutput: "['1', '2', 'Fizz', '4', 'Buzz', 'Fizz', '7', '8', 'Fizz', 'Buzz', '11', 'Fizz', '13', '14', 'FizzBuzz']",
    retryHelp: "Check i%15==0 first (FizzBuzz), then i%3==0 (Fizz), then i%5==0 (Buzz), else str(i).",
  },
  {
    id: "6",
    tag: "Data",
    difficulty: 2,
    title: "Word Frequency Counter",
    description: "Analyze any text like a data scientist! Count how many times each word appears, case-insensitive.",
    criteria: "word_freq('the cat and the hat') returns {'the': 2, 'cat': 1, 'and': 1, 'hat': 1}.",
    mentorInstructions: "Guide through split(), lower(), and dictionary counting. Mention dict.get() or defaultdict.",
    rubric: "Function word_freq(text) must return dict with lowercase words as keys and counts as values.",
    steps: [
      "Define `word_freq(text)` function",
      "Convert text to lowercase and split into words",
      "Use a dictionary to count occurrences of each word",
      "Return the frequency dictionary",
    ],
    starterCode: `def word_freq(text):\n    # Count every word\n    pass\n\n# Test it:\nprint(word_freq("the cat and the hat"))  \n# Expected: {'the': 2, 'cat': 1, 'and': 1, 'hat': 1}`,
    expectedOutput: "{'the': 2, 'cat': 1, 'and': 1, 'hat': 1}",
    retryHelp: "words = text.lower().split(). Use a dict: freq[word] = freq.get(word, 0) + 1.",
  },
  {
    id: "7",
    tag: "Game",
    difficulty: 2,
    title: "Rock Paper Scissors Engine",
    description: "Build the logic engine for Rock Paper Scissors. Determine the winner given two player choices.",
    criteria: "rps('rock','scissors') returns 'Player 1 wins'. rps('paper','paper') returns 'Draw'. Use lowercase inputs.",
    mentorInstructions: "Guide through win conditions mapping. A dict of what beats what is elegant. Never give full code.",
    rubric: "Function rps(p1, p2) must return 'Player 1 wins', 'Player 2 wins', or 'Draw'.",
    steps: [
      "Define `rps(p1, p2)` function",
      "Handle the draw case first (p1 == p2)",
      "Define which choice beats which using a dictionary",
      "Return the appropriate winner string",
    ],
    starterCode: `def rps(p1, p2):\n    # Who wins? Rock, Paper, or Scissors!\n    pass\n\n# Test it:\nprint(rps("rock", "scissors"))  # Expected: Player 1 wins\nprint(rps("paper", "rock"))      # Expected: Player 1 wins\nprint(rps("rock", "paper"))      # Expected: Player 2 wins\nprint(rps("rock", "rock"))       # Expected: Draw`,
    expectedOutput: "Player 1 wins",
    retryHelp: "wins = {'rock':'scissors', 'scissors':'paper', 'paper':'rock'}. If wins[p1]==p2 → P1 wins.",
  },
  {
    id: "8",
    tag: "Matrix",
    difficulty: 3,
    title: "Spiral Matrix",
    description: "Generate a matrix filled with numbers 1 to n² in a beautiful clockwise spiral pattern.",
    criteria: "spiral(3) returns [[1,2,3],[8,9,4],[7,6,5]]. Return a list of lists.",
    mentorInstructions: "Guide through boundary tracking (top/bottom/left/right). Shrink boundaries after each direction. Complex but rewarding.",
    rubric: "Function spiral(n) must return n×n matrix with numbers 1 to n² in clockwise spiral order.",
    steps: [
      "Define `spiral(n)` function",
      "Create an n×n matrix filled with zeros",
      "Track boundaries: top, bottom, left, right",
      "Fill numbers 1 to n² going right→down→left→up, shrinking boundaries each pass",
    ],
    starterCode: `def spiral(n):\n    # Fill a matrix in spiral order\n    pass\n\n# Test it:\nfor row in spiral(3):\n    print(row)\n# Expected:\n# [1, 2, 3]\n# [8, 9, 4]\n# [7, 6, 5]`,
    expectedOutput: "[[1, 2, 3], [8, 9, 4], [7, 6, 5]]",
    retryHelp: "Use 4 boundaries. Go right across top row → increment top. Down right col → decrement right. Left across bottom → decrement bottom. Up left col → increment left.",
  },
  {
    id: "9",
    tag: "Puzzle",
    difficulty: 2,
    title: "Valid Parentheses",
    description: "Build a bracket validator used in every code editor! Check if brackets are properly opened and closed.",
    criteria: "is_valid('({[]})') returns True. is_valid('([)]') returns False. Handle (), [], {}.",
    mentorInstructions: "Introduce the stack data structure concept. Push openers, pop and match closers. Guide step by step.",
    rubric: "Function is_valid(s) must correctly validate nested brackets using stack logic.",
    steps: [
      "Define `is_valid(s)` function",
      "Use a list as a stack — push opening brackets",
      "For closing brackets, check if stack top matches",
      "Return True only if stack is empty at the end",
    ],
    starterCode: `def is_valid(s):\n    # Validate the brackets!\n    pass\n\n# Test it:\nprint(is_valid("({[]})"))  # Expected: True\nprint(is_valid("([)]"))    # Expected: False\nprint(is_valid("((()))"))  # Expected: True\nprint(is_valid("{[}"))     # Expected: False`,
    expectedOutput: "True",
    retryHelp: "Stack approach: push '(' when you see '('. When you see ')', pop and check it matches. Use a mapping dict: ')':'(', ']':'[', '}':'{'.",
  },
  {
    id: "10",
    tag: "Cipher",
    difficulty: 3,
    title: "Vigenère Cipher",
    description: "Level up from Caesar! The Vigenère cipher uses a keyword to create an 'unbreakable' encryption (it was cracked in 1863).",
    criteria: "vigenere('HELLO','KEY') returns 'RIJVS'. Only encrypt A-Z uppercase letters. Repeat key to match text length.",
    mentorInstructions: "It's like Caesar but each letter uses a different shift from the key. Guide the key cycling logic.",
    rubric: "Function vigenere(text, key) must shift each letter by the corresponding key letter's position (A=0, B=1...).",
    steps: [
      "Define `vigenere(text, key)` function",
      "Cycle through key characters using modulo",
      "For each text letter, shift by the key letter's alphabet position",
      "Return the encrypted string",
    ],
    starterCode: `def vigenere(text, key):\n    # The 'unbreakable' cipher\n    pass\n\n# Test it:\nprint(vigenere("HELLO", "KEY"))       # Expected: RIJVS\nprint(vigenere("ATTACKATDAWN", "LEMON"))  # Expected: LXFOPVEFRNHR`,
    expectedOutput: "RIJVS",
    retryHelp: "For each char: shift = ord(key[i % len(key)]) - ord('A'). Then apply Caesar shift for that letter. Cycle key index only for alpha chars.",
  },
  {
    id: "11",
    tag: "Art",
    difficulty: 1,
    title: "Diamond Pattern",
    description: "Create ASCII art! Print a diamond shape made of stars given a height (always odd number).",
    criteria: "diamond(5) returns a string with 5 lines forming a diamond. Center-aligned with spaces.",
    mentorInstructions: "Guide through the two halves — expanding then contracting. Use string centering or manual spaces.",
    rubric: "Function diamond(n) must return a multi-line string forming a centered diamond of height n.",
    steps: [
      "Define `diamond(n)` function",
      "Build the top half: 1, 3, 5... stars, centered",
      "Build the bottom half: shrinking back down",
      "Return joined lines as a single string",
    ],
    starterCode: `def diamond(n):\n    # Draw a sparkly diamond!\n    pass\n\n# Test it:\nprint(diamond(5))\n# Expected output:\n#   *\n#  ***\n# *****\n#  ***\n#   *`,
    expectedOutput: "  *\n ***\n*****\n ***\n  *",
    retryHelp: "Top half: for i in range(1, n+1, 2) → ('*' * i).center(n). Bottom half: reverse. Join with newlines.",
  },
  {
    id: "12",
    tag: "Crypto",
    difficulty: 2,
    title: "Run-Length Encoding",
    description: "Compress data like the pros! Replace consecutive repeated chars with the char and its count.",
    criteria: "rle_encode('aaabbc') returns 'a3b2c1'. rle_encode('') returns ''.",
    mentorInstructions: "Guide through tracking current char and count. When char changes, append to result and reset.",
    rubric: "Function rle_encode(s) must return compressed string with each char followed by its consecutive count.",
    steps: [
      "Define `rle_encode(s)` function",
      "Track the current character and its consecutive count",
      "When the character changes, append char+count to result",
      "Don't forget to append the last group!",
    ],
    starterCode: `def rle_encode(s):\n    # Compress the string!\n    pass\n\n# Test it:\nprint(rle_encode("aaabbc"))      # Expected: a3b2c1\nprint(rle_encode("wwwwaaadexx"))  # Expected: w4a3d1e1x2`,
    expectedOutput: "a3b2c1",
    retryHelp: "Track current_char and count. Loop through string, if same char → count++, else → append current_char+str(count) and reset. Handle last group after loop.",
  },
  {
    id: "13",
    tag: "Math",
    difficulty: 3,
    title: "Roman Numeral Converter",
    description: "Travel back to ancient Rome! Convert integers into Roman numerals — a system still used on clock faces and movie credits.",
    criteria: "to_roman(1994) returns 'MCMXCIV'. Handle 1 to 3999. Use subtractive notation (IV, IX, XL, etc.).",
    mentorInstructions: "Guide through greedy algorithm with value-symbol pairs. Start from largest value, subtract and append.",
    rubric: "Function to_roman(num) must convert int to valid Roman numeral string with subtractive notation.",
    steps: [
      "Define `to_roman(num)` function",
      "Create ordered list of value-symbol pairs (1000:M, 900:CM, 500:D, ...)",
      "Greedily subtract largest possible value and append its symbol",
      "Repeat until num reaches 0",
    ],
    starterCode: `def to_roman(num):\n    # When in Rome...\n    pass\n\n# Test it:\nprint(to_roman(1994))  # Expected: MCMXCIV\nprint(to_roman(58))    # Expected: LVIII\nprint(to_roman(3549))  # Expected: MMMDXLIX`,
    expectedOutput: "MCMXCIV",
    retryHelp: "vals = [(1000,'M'),(900,'CM'),(500,'D'),(400,'CD'),...,(1,'I')]. While num > 0: if num >= val, subtract and append symbol.",
  },
  {
    id: "14",
    tag: "Security",
    difficulty: 2,
    title: "Password Strength Checker",
    description: "Build a password auditor! Score passwords based on length, variety of character types, and common patterns.",
    criteria: "check_password returns 'Weak', 'Medium', or 'Strong'. Strong: 8+ chars with upper, lower, digit, and special char.",
    mentorInstructions: "Guide through checking character categories with any() and generator expressions. Build score incrementally.",
    rubric: "Function check_password(pw) must evaluate length, char types presence, and return correct strength label.",
    steps: [
      "Define `check_password(pw)` function",
      "Check for: length ≥ 8, uppercase, lowercase, digits, special chars",
      "Score: 0-2 criteria = 'Weak', 3 = 'Medium', 4-5 = 'Strong'",
      "Return the strength label",
    ],
    starterCode: `def check_password(pw):\n    # How strong is this password?\n    pass\n\n# Test it:\nprint(check_password("abc"))           # Expected: Weak\nprint(check_password("Hello123"))      # Expected: Medium\nprint(check_password("H3llo_W0rld!"))  # Expected: Strong`,
    expectedOutput: "Weak",
    retryHelp: "Score = sum of: len(pw)>=8, any(c.isupper() for c in pw), any(c.islower()...), any(c.isdigit()...), any(c in '!@#$%...' ...).",
  },
  {
    id: "15",
    tag: "Algorithm",
    difficulty: 3,
    title: "Tower of Hanoi",
    description: "The legendary puzzle! Return the sequence of moves to transfer n disks from peg A to peg C using peg B.",
    criteria: "hanoi(2) returns [('A','B'), ('A','C'), ('B','C')]. Return list of (source, destination) tuples.",
    mentorInstructions: "Classic recursion problem. Move n-1 disks to helper, move largest to target, move n-1 from helper to target.",
    rubric: "Function hanoi(n) must return correct list of (src, dst) move tuples for n disks.",
    steps: [
      "Define `hanoi(n, src='A', dst='C', helper='B')` function",
      "Base case: n=1 → move directly from src to dst",
      "Recursive: move n-1 to helper, move disk to dst, move n-1 from helper to dst",
      "Collect and return all moves as a list",
    ],
    starterCode: `def hanoi(n, src='A', dst='C', helper='B'):\n    # Solve the ancient puzzle!\n    pass\n\n# Test it:\nprint(hanoi(2))  # Expected: [('A','B'), ('A','C'), ('B','C')]\nprint(hanoi(3))  # 7 moves for 3 disks`,
    expectedOutput: "[('A', 'B'), ('A', 'C'), ('B', 'C')]",
    retryHelp: "Base: n==1 → return [(src, dst)]. Recursive: hanoi(n-1, src, helper, dst) + [(src, dst)] + hanoi(n-1, helper, dst, src).",
  },
  {
    id: "16",
    tag: "Data",
    difficulty: 2,
    title: "Matrix Transposer",
    description: "Flip a matrix over its diagonal — rows become columns! Essential for data science and image processing.",
    criteria: "transpose([[1,2,3],[4,5,6]]) returns [[1,4],[2,5],[3,6]]. Handle any rectangular matrix.",
    mentorInstructions: "Guide through nested list comprehension or zip(*matrix) approach. Both are valuable learning.",
    rubric: "Function transpose(matrix) must return correctly transposed matrix as list of lists.",
    steps: [
      "Define `transpose(matrix)` function",
      "Swap rows and columns: element at [i][j] goes to [j][i]",
      "Use zip(*matrix) for an elegant one-liner, or nested loops",
      "Return the transposed matrix as list of lists",
    ],
    starterCode: `def transpose(matrix):\n    # Flip rows and columns!\n    pass\n\n# Test it:\nprint(transpose([[1,2,3],[4,5,6]]))\n# Expected: [[1,4],[2,5],[3,6]]\nprint(transpose([[1],[2],[3]]))\n# Expected: [[1,2,3]]`,
    expectedOutput: "[[1, 4], [2, 5], [3, 6]]",
    retryHelp: "Elegant: [list(row) for row in zip(*matrix)]. Or manually: for j in range(cols): new_row = [matrix[i][j] for i in range(rows)].",
  },
  {
    id: "17",
    tag: "Puzzle",
    difficulty: 3,
    title: "Sudoku Row Validator",
    description: "Be a Sudoku judge! Check whether every row in a 9×9 Sudoku grid contains digits 1-9 with no repeats.",
    criteria: "valid_rows(grid) returns True only if each row has all digits 1-9 exactly once. 0 means empty (invalid).",
    mentorInstructions: "Guide through set comparison. Each row should equal {1,2,...,9}. Simple but builds toward full validator.",
    rubric: "Function valid_rows(grid) must check all 9 rows and return True only if all contain digits 1-9 exactly once.",
    steps: [
      "Define `valid_rows(grid)` function",
      "For each row in the grid, convert it to a set",
      "Compare the set to {1, 2, 3, 4, 5, 6, 7, 8, 9}",
      "Return True only if ALL rows match",
    ],
    starterCode: `def valid_rows(grid):\n    # Judge the Sudoku!\n    pass\n\n# Test it:\ngood_grid = [\n    [5,3,4,6,7,8,9,1,2],\n    [6,7,2,1,9,5,3,4,8],\n    [1,9,8,3,4,2,5,6,7],\n    [8,5,9,7,6,1,4,2,3],\n    [4,2,6,8,5,3,7,9,1],\n    [7,1,3,9,2,4,8,5,6],\n    [9,6,1,5,3,7,2,8,4],\n    [2,8,7,4,1,9,6,3,5],\n    [3,4,5,2,8,6,1,7,9]\n]\nprint(valid_rows(good_grid))  # Expected: True`,
    expectedOutput: "True",
    retryHelp: "target = set(range(1, 10)). Return all(set(row) == target for row in grid).",
  },
  {
    id: "18",
    tag: "Game",
    difficulty: 2,
    title: "Blackjack Hand Scorer",
    description: "Deal yourself in! Calculate a Blackjack hand score where Aces can be 1 or 11 (whichever is better without busting).",
    criteria: "blackjack(['A','K']) returns 21. blackjack(['A','A','9']) returns 21. Cards: 2-10, J, Q, K, A.",
    mentorInstructions: "Face cards = 10. Aces start as 11, convert to 1 if bust. Guide through ace-handling logic.",
    rubric: "Function blackjack(hand) must return optimal score, correctly handling flexible Ace values.",
    steps: [
      "Define `blackjack(hand)` function",
      "Count aces separately; J/Q/K = 10, digits = face value",
      "Start with aces as 11; if total > 21, convert aces to 1 one at a time",
      "Return the best possible score",
    ],
    starterCode: `def blackjack(hand):\n    # Hit me!\n    pass\n\n# Test it:\nprint(blackjack(['A', 'K']))        # Expected: 21 (Blackjack!)\nprint(blackjack(['A', 'A', '9']))   # Expected: 21\nprint(blackjack(['5', '6', 'Q']))   # Expected: 21\nprint(blackjack(['K', 'Q', '5']))   # Expected: 25 (Bust!)`,
    expectedOutput: "21",
    retryHelp: "Sum non-aces first (J/Q/K=10). Add 11 per ace. While total > 21 and aces_as_11 > 0: subtract 10, decrement aces_as_11.",
  },
  {
    id: "19",
    tag: "Algorithm",
    difficulty: 3,
    title: "Flatten the Abyss",
    description: "Write a function that flattens infinitely nested lists into a single flat list. How deep does the rabbit hole go?",
    criteria: "flatten([1,[2,[3,[4]],5]]) returns [1,2,3,4,5]. Handle any nesting depth. Preserve order.",
    mentorInstructions: "Classic recursion. If element is a list, recurse. Otherwise append. Guide through isinstance() check.",
    rubric: "Function flatten(lst) must recursively flatten arbitrarily nested lists into a single flat list.",
    steps: [
      "Define `flatten(lst)` function",
      "Iterate through each element in the list",
      "If element is a list, recursively flatten it and extend result",
      "If element is not a list, append it directly",
    ],
    starterCode: `def flatten(lst):\n    # Unravel the nested madness!\n    pass\n\n# Test it:\nprint(flatten([1, [2, [3, [4]], 5]]))  # Expected: [1, 2, 3, 4, 5]\nprint(flatten([[['a']], [['b', ['c']]]]))  # Expected: ['a', 'b', 'c']`,
    expectedOutput: "[1, 2, 3, 4, 5]",
    retryHelp: "result = []. For item in lst: if isinstance(item, list): result.extend(flatten(item)) else result.append(item). Return result.",
  },
  {
    id: "20",
    tag: "Simulation",
    difficulty: 3,
    title: "Conway's Game of Life Step",
    description: "Simulate one generation of Conway's Game of Life — the cellular automaton that creates complexity from simple rules!",
    criteria: "next_gen(grid) returns new grid after one step. 1=alive, 0=dead. Standard rules: survive with 2-3 neighbors, birth with exactly 3.",
    mentorInstructions: "Explain the 4 rules. Guide neighbor counting with boundary checks. Create new grid, don't modify in-place.",
    rubric: "Function next_gen(grid) must return correct next generation following all 4 Conway rules on a 2D grid.",
    steps: [
      "Define `next_gen(grid)` function",
      "For each cell, count its live neighbors (8 surrounding cells)",
      "Apply rules: alive with 2-3 neighbors survives, dead with 3 neighbors is born, all else dies",
      "Return a NEW grid (don't modify the original!)",
    ],
    starterCode: `def next_gen(grid):\n    # Life finds a way!\n    pass\n\n# Test it - Blinker oscillator:\ngrid = [\n    [0, 0, 0, 0, 0],\n    [0, 0, 1, 0, 0],\n    [0, 0, 1, 0, 0],\n    [0, 0, 1, 0, 0],\n    [0, 0, 0, 0, 0]\n]\nresult = next_gen(grid)\nfor row in result:\n    print(row)\n# Expected: vertical line becomes horizontal\n# [0,0,0,0,0]\n# [0,0,0,0,0]\n# [0,1,1,1,0]\n# [0,0,0,0,0]\n# [0,0,0,0,0]`,
    expectedOutput: "[[0,0,0,0,0],[0,0,0,0,0],[0,1,1,1,0],[0,0,0,0,0],[0,0,0,0,0]]",
    retryHelp: "Count neighbors: loop dx,dy in [-1,0,1]x[-1,0,1], skip (0,0). Check bounds. New grid: alive stays alive if 2-3 neighbors; dead becomes alive if exactly 3 neighbors.",
  },
];

type OutputStatus = "idle" | "success" | "error" | "info";
type OutputTab = "output" | "tests";

interface TestResult {
  index: number;
  passed: boolean;
  value?: unknown;
  expected?: unknown;
  error?: string;
}

interface PyodideRuntime {
  pyodide: unknown;
  runner: (code: string) => { toJs: (opts: { dict_converter: typeof Object.fromEntries }) => { stdout: string; stderr: string; error: string }; destroy: () => void };
}

export default function IdePage() {
  const [selectedChallengeId, setSelectedChallengeId] = useState("1");
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [completedChallenges, setCompletedChallenges] = useState<Set<string>>(new Set());
  
  const challenge = challenges.find(c => c.id === selectedChallengeId) || challenges[0];
  
  const [code, setCode] = useState(challenge.starterCode);
  const [output, setOutput] = useState("Run your code to see output here.");
  const [feedback, setFeedback] = useState("Feedback will appear right after each run.");
  const [outputStatus, setOutputStatus] = useState<OutputStatus>("idle");
  const [outputTab, setOutputTab] = useState<OutputTab>("output");
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [mentorHint, setMentorHint] = useState("Run your code first, then request a hint if you still feel stuck.");
  const [mentorTone, setMentorTone] = useState("Status: idle");
  const [running, setRunning] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const pyodideRef = useRef<PyodideRuntime | null>(null);
  const lastErrorRef = useRef("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setElapsedTime(t => t + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive]);

  // Reset when challenge changes
  useEffect(() => {
    setCode(challenge.starterCode);
    setOutput("Run your code to see output here.");
    setFeedback("Feedback will appear right after each run.");
    setOutputStatus("idle");
    setTestResults([]);
    setMentorHint("Run your code first, then request a hint if you still feel stuck.");
    setMentorTone("Status: idle");
    setElapsedTime(0);
    setTimerActive(false);
    lastErrorRef.current = "";
  }, [selectedChallengeId, challenge.starterCode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        runCode();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "h") {
        e.preventDefault();
        requestHint();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [code, output]);

  useEffect(() => {
    let cancelled = false;
    async function loadPyodide() {
      try {
        if (!(window as unknown as Record<string, unknown>).loadPyodide) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js";
            script.onload = () => resolve();
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }
        const load = (window as unknown as Record<string, unknown>).loadPyodide as (opts: { indexURL: string }) => Promise<unknown>;
        const pyodide: Record<string, unknown> = await load({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/" }) as Record<string, unknown>;
        const runPythonAsync = pyodide.runPythonAsync as (code: string) => Promise<unknown>;
        await runPythonAsync(`
from io import StringIO
import sys, traceback

def pulse_run(source: str):
    stdout = sys.stdout
    stderr = sys.stderr
    out = StringIO()
    err = StringIO()
    result = {"stdout": "", "stderr": "", "error": ""}
    sys.stdout = out
    sys.stderr = err
    try:
        exec(source, {})
    except Exception as exc:
        result["error"] = f"{exc.__class__.__name__}: {exc}"
        err.write(traceback.format_exc())
    finally:
        result["stdout"] = out.getvalue()
        result["stderr"] = err.getvalue()
        sys.stdout = stdout
        sys.stderr = stderr
    return result
`);
        if (!cancelled) {
          const globals = pyodide.globals as { get: (name: string) => unknown };
          pyodideRef.current = {
            pyodide,
            runner: globals.get("pulse_run") as PyodideRuntime["runner"],
          };
        }
      } catch (error) {
        console.error("Pyodide failed to initialize", error);
      }
    }
    loadPyodide();
    return () => { cancelled = true; };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const runCode = useCallback(async () => {
    if (!timerActive) setTimerActive(true);
    
    if (!code.trim()) {
      setOutput("");
      setFeedback("Type your solution before running.");
      setOutputStatus("error");
      return;
    }

    setRunning(true);
    setFeedback("Running code…");
    setOutputStatus("info");

    const runtime = pyodideRef.current;
    if (!runtime) {
      setFeedback("Python runtime is still loading. Please try again in a moment.");
      setOutputStatus("info");
      setRunning(false);
      return;
    }

    try {
      const proxy = runtime.runner(code);
      const result = proxy.toJs({ dict_converter: Object.fromEntries });
      proxy.destroy();

      if (result.error) {
        setOutput(result.stdout || result.stderr);
        setFeedback(`${result.error}. Check your syntax and try again.`);
        setOutputStatus("error");
        lastErrorRef.current = result.error;
        setTestResults([{ index: 1, passed: false, error: result.error }]);
      } else {
        setOutput(result.stdout || "(no output captured)");
        
        // Simulate test results for visual feedback
        const hasOutput = (result.stdout || "").trim().length > 0;
        if (hasOutput) {
          setFeedback("Code ran successfully! Submit to check against test cases.");
          setOutputStatus("success");
          // Award XP if not already completed
          if (!completedChallenges.has(challenge.id)) {
            fetch("/api/leaderboard/xp", {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json", ...applyAuthHeaders() },
              body: JSON.stringify({ action: "challenge_complete", challengeId: challenge.id }),
            }).catch(() => {});
          }
          setCompletedChallenges(prev => new Set([...prev, challenge.id]));
          setTestResults([
            { index: 1, passed: true, value: "Code executed", expected: "No errors" },
          ]);
          lastErrorRef.current = "";
        } else {
          setFeedback(`Your code ran but produced no output. ${challenge.retryHelp}`);
          setOutputStatus("error");
          setTestResults([{ index: 1, passed: false, error: "No output produced" }]);
          lastErrorRef.current = "No output";
        }
      }
    } catch {
      setOutput("");
      setFeedback("Unexpected error. Refresh the page and try again.");
      setOutputStatus("error");
      lastErrorRef.current = "Runtime failure";
    } finally {
      setRunning(false);
    }
  }, [code, challenge.id, challenge.retryHelp, timerActive]);

  const requestHint = useCallback(async () => {
    setHintLoading(true);
    setMentorHint("Thinking through your code…");
    setMentorTone("Status: contacting mentor");

    try {
      const res = await fetch("/api/mentorHint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          code,
          challengeTitle: challenge.title,
          description: challenge.description,
          rubric: challenge.rubric,
          mentorInstructions: challenge.mentorInstructions,
          stdout: output,
          stderr: lastErrorRef.current,
          expectedOutput: challenge.expectedOutput,
        }),
      });

      const data = await res.json();
      setMentorHint(data?.hint || "Keep iterating—focus on the logic step by step.");
      setMentorTone(`Tone: ${data?.tone ?? "spark"}`);
    } catch {
      setMentorHint("Mentor had a hiccup. Re-run your code and try again in a bit.");
      setMentorTone("Status: retry later");
    } finally {
      setHintLoading(false);
    }
  }, [code, output, challenge]);

  const resetChallenge = () => {
    setCode(challenge.starterCode);
    setOutput("Run your code to see output here.");
    setFeedback("Feedback will appear right after each run.");
    setOutputStatus("idle");
    setTestResults([]);
    setElapsedTime(0);
    setTimerActive(false);
  };

  const statusConfig = {
    idle: { label: "Ready", color: "text-muted", icon: Terminal },
    success: { label: "Passed", color: "text-success", icon: CheckCircle2 },
    error: { label: "Failed", color: "text-danger", icon: XCircle },
    info: { label: "Running…", color: "text-warning", icon: Terminal },
  };
  const st = statusConfig[outputStatus];
  const StatusIcon = st.icon;

  const difficultyColors = {
    1: "text-success",
    2: "text-warning",
    3: "text-danger",
  };

  const difficultyLabels = {
    1: "Easy",
    2: "Medium",
    3: "Hard",
  };

  const progressPercent = (completedChallenges.size / challenges.length) * 100;

  return (
    <AuthGuard>
    <div className="h-[calc(100vh-64px)] overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-accent/5 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 relative h-full flex flex-col">
        {/* Top Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 flex-shrink-0"
        >
          <div className="glass-card p-2.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium">Progress</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-48 h-2 bg-bg-elevated rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-accent to-accent-hot"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <span className="text-xs text-muted">{completedChallenges.size}/{challenges.length}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted" />
                <span className="font-mono text-muted">{formatTime(elapsedTime)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <Keyboard className="w-4 h-4" />
                <span>Ctrl+Enter to run</span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-[320px_1fr] gap-4 flex-1 min-h-0">
          {/* Left Sidebar - Challenge Panel */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-3 min-h-0"
          >
            {/* Challenge Selector */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setSelectorOpen(!selectorOpen)}
                className="w-full glass-card p-3 flex items-center justify-between hover:border-accent/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-hot flex items-center justify-center">
                    <Code2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Challenge {challenge.id}</span>
                      {completedChallenges.has(challenge.id) && (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      )}
                    </div>
                    <span className="text-xs text-muted">{challenge.title}</span>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-muted transition-transform ${selectorOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {selectorOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 glass-card p-2 z-50 max-h-80 overflow-y-auto"
                  >
                    {challenges.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedChallengeId(c.id);
                          setSelectorOpen(false);
                        }}
                        className={`w-full p-3 rounded-lg flex items-center justify-between hover:bg-bg-elevated transition-colors ${
                          c.id === selectedChallengeId ? "bg-bg-elevated border border-accent/20" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-bg-elevated flex items-center justify-center text-xs font-mono">
                            {c.id}
                          </span>
                          <div className="text-left">
                            <span className="text-sm">{c.title}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-xs ${difficultyColors[c.difficulty as keyof typeof difficultyColors]}`}>
                                {difficultyLabels[c.difficulty as keyof typeof difficultyLabels]}
                              </span>
                            </div>
                          </div>
                        </div>
                        {completedChallenges.has(c.id) && (
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Challenge Details Card - Scrollable */}
            <Card className="flex-1 min-h-0 overflow-y-auto space-y-3 scrollbar-thin">
              <div className="flex items-center gap-2">
                <Badge variant="accent">{challenge.tag}</Badge>
                <Badge className={difficultyColors[challenge.difficulty as keyof typeof difficultyColors]}>
                  {difficultyLabels[challenge.difficulty as keyof typeof difficultyLabels]}
                </Badge>
              </div>
              
              <h1 className="text-lg font-bold gradient-text">{challenge.title}</h1>
              <p className="text-xs text-muted leading-relaxed">{challenge.description}</p>

              <div className="space-y-1.5 bg-bg-elevated/50 p-3 rounded-lg border border-border">
                <div className="flex items-center gap-2 text-xs font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                  Success criteria
                </div>
                <p className="text-xs text-muted">{challenge.criteria}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium">
                  <ListChecks className="w-3.5 h-3.5 text-accent-light" />
                  Steps to solve
                </div>
                <ol className="space-y-1.5">
                  {challenge.steps.map((step, i) => (
                    <li key={i} className="flex gap-2 text-xs text-muted p-1.5 rounded-md bg-bg-elevated/30">
                      <span className="text-accent font-mono font-bold text-[10px]">{String(i + 1).padStart(2, "0")}</span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </Card>
          </motion.aside>

          {/* Main Workspace */}
          <div className="flex flex-col gap-3 min-h-0">
            {/* Editor Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex-shrink-0"
            >
              <Card className="space-y-2 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/3 to-transparent pointer-events-none" />
                
                {/* Editor Header - File Tab Style */}
                <div className="flex items-center justify-between relative">
                  <div className="flex items-center gap-1">
                    <div className="flex items-center gap-2 px-4 py-2 bg-bg-elevated rounded-t-lg border-b-2 border-accent">
                      <Code2 className="w-4 h-4 text-accent" />
                      <span className="text-sm font-medium">solution.py</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={resetChallenge}>
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </Button>
                    <Button onClick={runCode} loading={running} className="relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-r from-accent to-accent-hot opacity-0 group-hover:opacity-100 transition-opacity" />
                      <Play className="w-4 h-4 relative" />
                      <span className="relative">{running ? "Running…" : "Run Code"}</span>
                      <Zap className="w-3 h-3 ml-1 relative" />
                    </Button>
                  </div>
                </div>

                {/* Monaco Editor */}
                <div className="rounded-lg overflow-hidden border border-border shadow-inner">
                  <MonacoEditor
                    height="180px"
                    language="python"
                    theme="vs-dark"
                    value={code}
                    onChange={(v) => setCode(v || "")}
                    options={{
                      minimap: { enabled: false },
                      automaticLayout: true,
                      fontSize: 13,
                      fontFamily: "var(--font-mono), JetBrains Mono, monospace",
                      padding: { top: 8, bottom: 8 },
                      lineNumbers: "on",
                      renderLineHighlight: "all",
                      scrollBeyondLastLine: false,
                      smoothScrolling: true,
                      cursorBlinking: "smooth",
                      cursorSmoothCaretAnimation: "on",
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted">
                  <span>Python 3.11 via Pyodide</span>
                  <span>Press Ctrl+H for AI hint</span>
                </div>
              </Card>
            </motion.div>

            {/* Output and Mentor Panels */}
            <div className="grid md:grid-cols-2 gap-3 flex-1 min-h-0">
              {/* Output Panel with Tabs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="min-h-0"
              >
                <Card className="h-full flex flex-col space-y-2 overflow-hidden">
                  {/* Tabs */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 p-1 bg-bg-elevated rounded-lg">
                      <button
                        onClick={() => setOutputTab("output")}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          outputTab === "output" 
                            ? "bg-accent text-white" 
                            : "text-muted hover:text-white"
                        }`}
                      >
                        <Terminal className="w-3 h-3 inline mr-1.5" />
                        Output
                      </button>
                      <button
                        onClick={() => setOutputTab("tests")}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          outputTab === "tests" 
                            ? "bg-accent text-white" 
                            : "text-muted hover:text-white"
                        }`}
                      >
                        <FlaskConical className="w-3 h-3 inline mr-1.5" />
                        Tests
                      </button>
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs font-medium ${st.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {st.label}
                    </div>
                  </div>

                  {/* Tab Content */}
                  <AnimatePresence mode="wait">
                    {outputTab === "output" ? (
                      <motion.div
                        key="output"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <pre className="p-3 bg-bg-elevated rounded-lg text-xs font-mono h-[80px] overflow-auto text-muted-light border border-border/50">
                          {output}
                        </pre>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="tests"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {testResults.length === 0 ? (
                          <div className="p-3 bg-bg-elevated rounded-lg text-xs text-muted text-center h-[80px] flex items-center justify-center">
                            Run your code to see test results
                          </div>
                        ) : (
                          <div className="space-y-1.5 p-2 bg-bg-elevated rounded-lg h-[80px] overflow-auto">
                            {testResults.map((test) => (
                              <div
                                key={test.index}
                                className={`flex items-center gap-2 p-2 rounded-md border ${
                                  test.passed 
                                    ? "bg-success-muted border-success/20" 
                                    : "bg-danger-muted border-danger/20"
                                }`}
                              >
                                {test.passed ? (
                                  <CheckCircle2 className="w-3 h-3 text-success" />
                                ) : (
                                  <XCircle className="w-3 h-3 text-danger" />
                                )}
                                <div className="flex-1 text-[10px]">
                                  <span className="font-medium">Test {test.index}</span>
                                  {test.error && <span className="text-muted ml-1">{test.error}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <p className="text-xs text-muted flex-shrink-0">{feedback}</p>
                </Card>
              </motion.div>

              {/* AI Mentor Panel */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="min-h-0"
              >
                <Card className="h-full flex flex-col space-y-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-radial from-accent/10 to-transparent pointer-events-none" />
                  
                  <div className="flex items-center justify-between relative flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-gradient-to-br from-accent to-accent-hot flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-xs">AI Mentor</h2>
                        <span className="text-[10px] text-muted">Gemini</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={requestHint} loading={hintLoading}>
                      <Lightbulb className="w-3 h-3" />
                      {hintLoading ? "..." : "Hint"}
                    </Button>
                  </div>

                  <div className="p-3 bg-gradient-to-br from-accent-muted/40 to-accent-muted/20 rounded-lg border border-accent/10 relative flex-1 overflow-auto">
                    <div className="absolute top-2 right-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    </div>
                    <p className="text-xs leading-relaxed pr-3">{mentorHint}</p>
                    <div className="flex items-center gap-2 pt-2 mt-2 border-t border-accent/10">
                      <span className="text-[10px] text-muted font-mono">{mentorTone}</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}
