import re
import json
import logging
from typing import Dict, Any

# Ensure these imports match your actual project structure
from app.agents.tools import fetch_user_profile_func, run_underwriting_func, create_loan_application_func

# Initialize logger
logger = logging.getLogger(__name__)

class MasterAgent:
    """
    Main agent class that handles user messages.
    """
    def __init__(self):
        # Initialize any necessary state or configuration here
        pass

    async def process_message(self, user_id: str, session_id: str, user_message: str) -> Dict[str, Any]:
        """
        Wrapper to route to the simple state machine logic.
        Renamed to 'process_message' so existing routers calling this method don't break.
        """
        return await self.process_message_simple(user_id, session_id, user_message)

    async def process_message_simple(
        self,
        user_id: str,
        session_id: str,
        user_message: str,
    ) -> Dict[str, Any]:
        """
        Simplified message processing using state machine instead of ReAct agent.
        This ALWAYS works and never loops.
        """
        try:
            # Import inside function to avoid circular dependency
            from app.services.session_service import session_service
            
            # Get session state
            session = session_service.get_session(session_id) or {}
            
            # Normalize input
            user_message_lower = user_message.lower()
            
            # --- STATE 1: User provides loan details (Extract Intent) ---
            # Heuristic: Check for digits and keywords like 'lakh', 'month', or currency symbols
            if "₹" in user_message or "lakh" in user_message_lower or "month" in user_message_lower or any(c.isdigit() for c in user_message):
                
                # 1. Extract Amount: Remove commas for easier parsing, look for numbers
                clean_msg_for_amount = user_message.replace(',', '')
                amount_match = re.search(r'₹?\s*(\d+)', clean_msg_for_amount)
                
                # 2. Extract Tenure: Look for digits followed by 'month'
                tenure_match = re.search(r'(\d+)\s*month', user_message_lower)
                
                if amount_match and tenure_match:
                    amount = float(amount_match.group(1))
                    tenure = int(tenure_match.group(1))
                    
                    # Handling "5 lakh" logic (if user types '5' but says 'lakh', multiply by 100k)
                    if "lakh" in user_message_lower and amount < 1000:
                        amount = amount * 100000
                    
                    logger.info(f"Extracted: amount={amount}, tenure={tenure}")
                    
                    # Run underwriting directly
                    underwriting_input = json.dumps({
                        "user_id": user_id,
                        "session_id": session_id,
                        "requested_amount": amount,
                        "requested_tenure_months": tenure
                    })
                    
                    result_str = run_underwriting_func(underwriting_input)
                    result = json.loads(result_str)
                    
                    if result.get("success"):
                        decision = result["decision"]
                        approved_amt = result.get("approved_amount", amount)
                        emi = result.get("emi", 0)
                        tenure_res = result.get("tenure_months", tenure)
                        rate = result.get("interest_rate", 0)
                        
                        # Store in session
                        session_service.update_session(session_id, {
                            "loan_decision": result,
                            "current_step": decision
                        })
                        
                        if decision == "APPROVED":
                            reply = (
                                f"🎉 Great news! Your loan of ₹{approved_amt:,.0f} for {tenure_res} months is APPROVED!\n\n"
                                f"💰 Monthly EMI: ₹{emi:,.0f}\n"
                                f"📊 Interest Rate: {rate}% p.a.\n\n"
                                f"Would you like me to generate your official sanction letter now?"
                            )
                        elif decision == "ADJUST":
                            reply = result.get("explanation", "We need to adjust the loan terms.")
                        else:  # REJECTED
                            reply = result.get("explanation", "We cannot process this loan at this time.")
                        
                        return {
                            "reply": reply,
                            "decision": decision,
                            "loan_id": None,
                            "session_id": session_id
                        }
            
            # --- STATE 2: User accepts (says yes, ok, sure, etc.) ---
            if any(word in user_message_lower for word in ["yes", "ok", "sure", "accept", "proceed", "generate"]):
                # Check if we have a loan decision in session
                loan_decision = session.get("loan_decision")
                
                if loan_decision and loan_decision.get("decision") in ["APPROVED", "ADJUST"]:
                    # Generate sanction letter
                    create_input = json.dumps({
                        "user_id": user_id,
                        "session_id": session_id
                    })
                    
                    result_str = create_loan_application_func(create_input)
                    result = json.loads(result_str)
                    
                    if result.get("success"):
                        loan_id = result["loan_id"]
                        approved_amt = result["approved_amount"]
                        emi = result["emi"]
                        tenure = result["tenure_months"]
                        
                        reply = (
                            f"Perfect! Your sanction letter has been generated successfully! 🎉\n\n"
                            f"📄 Loan ID: {loan_id}\n"
                            f"💰 Approved Amount: ₹{approved_amt:,.0f}\n"
                            f"📅 Tenure: {tenure} months\n"
                            f"💳 Monthly EMI: ₹{emi:,.0f}\n\n"
                            f"Your sanction letter is valid for 7 days. Please visit any FinAgent branch with:\n"
                            f"• Original ID proof (Aadhaar/PAN/Passport)\n"
                            f"• Bank statements (last 6 months)\n"
                            f"• Salary slips (last 3 months)\n"
                            f"• This sanction letter\n\n"
                            f"We'll verify your documents and disburse the loan within 24 hours. Congratulations! 🎊"
                        )
                        
                        return {
                            "reply": reply,
                            "decision": "APPROVED",
                            "loan_id": loan_id,
                            "session_id": session_id
                        }
            
            # --- DEFAULT: Welcome message (Fall-through) ---
            reply = (
                "Hello! Welcome to FinAgent. 👋\n\n"
                "I can help you apply for a personal loan quickly and easily. "
                "Just tell me how much you need and for how long!\n\n"
                "For example: 'I need ₹5,00,000 for 36 months'"
            )
            
            return {
                "reply": reply,
                "decision": None,
                "loan_id": None,
                "session_id": session_id
            }
            
        except Exception as e:
            logger.error(f"Error in simple processing: {str(e)}", exc_info=True)
            return {
                "reply": "I apologize, but there was an error processing your request. Please try again.",
                "decision": None,
                "loan_id": None,
                "session_id": session_id
            }

# --- IMPORTANT: Instantiate the agent ---
# This is what app.agents.__init__ is trying to import
master_agent = MasterAgent()