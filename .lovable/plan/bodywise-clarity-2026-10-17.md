# Bodywise Clarity

Build a polished, mobile-first product discovery and education experience for Be Bodywise customers, clearly presented as an independent tool.

## Experience

- Replace the placeholder at `/` with a welcoming product finder and app-specific page metadata.
- Create a guided concern-selection flow for acne, oily skin, pigmentation, body odour, hair fall, and other; ask follow-up questions only where useful, with no unnecessary personal data.
- Show rule-based product matches with transparent reasons, limitations, realistic expectations, verified product details, and clear unavailable labels where sourcing is incomplete.
- Support comparing selected matches and revisiting/editing answers, with clear safety guidance and professional-care signposting.

## Design

- Establish the warm-white, muted-sage, premium wellness design system in the global stylesheet and apply it consistently.
- Use a generated, non-branded skincare visual and responsive layouts designed for mobile first.

## Technical details

- Keep the journey client-side and sign-up-free; use a structured, typed catalogue and deterministic matching rather than diagnosis or AI.
- Verify all catalogue facts against official sources before inclusion; never fabricate product information or treatment claims.
- Add focused tests for matching behavior and the required safety constraints; validate the app's main journey and current build output.
- Record the client-side catalogue and matching structure in `AGENTS.md`.  
  
The plan looks good. Before implementing, please ensure these additional requirements:
  1. **Evidence-based catalogue:** Start with a small catalogue of Be Bodywise products whose details can be verified from official product pages. Keep source URLs and verification status for each product. Do not invent ingredients, benefits, directions, side effects, or suitability claims. If details cannot be verified, display “Information not verified yet” and do not use them to make a recommendation.
  2. **Meaningful matching:** Build a transparent scoring or rule-based system that matches customer-selected concerns to verified product attributes. Show why each product matched, relevant limitations, and why it may not be suitable. Never claim a product will cure a condition.
  3. **Safety-first experience:** Do not diagnose skin or health conditions. Include relevant product precautions and clear guidance to stop use and seek appropriate professional advice for concerning reactions. Avoid personalised medical advice.
  4. **Complete user journey:** Make sure users can restart the questionnaire, edit answers, compare products, navigate backwards, and see a helpful result even when no suitable match exists.
  5. **Tests:** Add tests for deterministic matching, incomplete product data, unsupported claims, empty results, and safety notices. Run the tests and fix any failures before declaring the app complete.
  Keep the design polished, responsive, and independent rather than presenting this as an official Be Bodywise service.