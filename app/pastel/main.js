import Evaluator from "./evaluator.js";
import Error from "./error.js";

let evaluator = new Evaluator();
let value = evaluator.evaluateText(`

(define me 3)
(define factorial n (
    (if (< n 2) (1) 
        (* n (factorial (- n 1))))
)) 
(define fibonacci n (
    (if (= n 0) (0)
    (if (= n 1) (1)
        (+ (fibonacci (- n 1)) (fibonacci (- n 2)))))
))
(define check (n c) (
    (if (< (square n) (prime c)) (true)
        ((if (zero (modular n (prime c))) (false)
             (check n (+ c 1)))))
))
(define prime n (
    (if (= n 1) (2) (
    	(define search r (
    		(if (check r 1) (r) (search (+ r 1)))))
        (search (+ (prime (- n 1)) 1))))
))
(define plus (a b) (+ a b))
(print (plus (if (> 2 3) (1) (20)) me))
(print true)
(print (factorial 10))
(print (fibonacci 25))
(print (prime 16))

`);
if (value instanceof Error)
	console.log(value.message + " (At line " + value.stack[1][0]+")");