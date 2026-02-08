-- A simple RPN (Reverse Polish Notation) Calculator
import Data.List (foldl')
import Text.Read (readMaybe)

-- 1. Define possible results: either a Success (Number) or a Failure (Error String)
type CalcResult = Either String Double

-- 2. The core logic: process one "word" at a time against a stack of numbers
solveRPNStep :: [Double] -> String -> CalcResult
solveRPNStep (x:y:ys) "*"    = Right ((x * y) : ys)
solveRPNStep (x:y:ys) "+"    = Right ((x + y) : ys)
solveRPNStep (x:y:ys) "-"    = Right ((y - x) : ys)
solveRPNStep (x:y:ys) "/"    = if x == 0 then Left "Error: Div by Zero" else Right ((y / x) : ys)
solveRPNStep stack numberStr = 
    case readMaybe numberStr of
        Just n  -> Right (n : stack)
        Nothing -> Left ("Error: Invalid token '" ++ numberStr ++ "'")

-- 3. The main calculation function using foldl' to process the whole string
calculate :: String -> CalcResult
calculate input = foldM solveRPNStep [] (words input) >>= finalize
  where
    finalize [result] = Right result
    finalize _        = Left "Error: Stack contains multiple values"
    -- Helper to handle the "Either" monad chain
    foldM f z []     = Right z
    foldM f z (x:xs) = case f z x of
                         Left err -> Left err
                         Right z' -> foldM f z' xs

-- 4. Main Entry Point
main :: IO ()
main = do
    putStrLn "RPN Calc (Enter numbers & ops like '10 2 /'):"
    expr <- getLine
    case calculate expr of
        Right val -> putStrLn $ "Result: " ++ show val
        Left err  -> putStrLn err
