"""
PDF service for generating loan sanction letters.
Uses ReportLab to create professional PDF documents.
"""

import os
from datetime import datetime, timedelta
from typing import Any, Dict

from app.config import settings
from app.utils.logger import default_logger as logger
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


class PdfService:
    """Service for generating loan sanction letter PDFs."""

    def __init__(self):
        """Initialize PDF service with output directory."""
        # Use /tmp for Hugging Face Spaces compatibility
        import tempfile

        # Try to use configured directory, fall back to /tmp if not writable
        try:
            self.output_dir = settings.PDF_OUTPUT_DIR
            # Test if directory is writable
            os.makedirs(self.output_dir, exist_ok=True)
            test_file = os.path.join(self.output_dir, ".test_write")
            with open(test_file, "w") as f:
                f.write("test")
            os.remove(test_file)
            logger.info(f"Using PDF output directory: {self.output_dir}")
        except (OSError, PermissionError) as e:
            logger.warning(
                f"Cannot write to {settings.PDF_OUTPUT_DIR}: {e}. Using /tmp instead"
            )
            self.output_dir = tempfile.gettempdir()
            os.makedirs(os.path.join(self.output_dir, "sanctions"), exist_ok=True)
            self.output_dir = os.path.join(self.output_dir, "sanctions")
            logger.info(f"Using temporary PDF output directory: {self.output_dir}")

        self.validity_days = settings.PDF_VALIDITY_DAYS

    def generate_sanction_letter(self, loan_data: Dict[str, Any]) -> Dict[str, str]:
        """
        Generate a professional sanction letter PDF.

        Args:
            loan_data: Loan application data with all details

        Returns:
            Dictionary with pdf_path and pdf_url
        """
        try:
            loan_id = loan_data.get("loan_id", "unknown")
            logger.info(f"Starting PDF generation for loan_id: {loan_id}")
            logger.debug(f"Loan data keys: {list(loan_data.keys())}")

            filename = f"{loan_id}.pdf"
            filepath = os.path.join(self.output_dir, filename)
            logger.info(f"PDF will be saved to: {filepath}")

            # Ensure output directory exists
            if not os.path.exists(self.output_dir):
                logger.warning(
                    f"Output directory {self.output_dir} does not exist, creating it"
                )
                os.makedirs(self.output_dir, exist_ok=True)

            # Create PDF document
            try:
                doc = SimpleDocTemplate(
                    filepath,
                    pagesize=A4,
                    rightMargin=0.75 * inch,
                    leftMargin=0.75 * inch,
                    topMargin=1 * inch,
                    bottomMargin=0.75 * inch,
                )
                logger.info("PDF document template created successfully")
            except Exception as doc_error:
                logger.error(
                    f"Failed to create PDF document template: {str(doc_error)}"
                )
                raise

            # Build content
            elements = []
            styles = getSampleStyleSheet()

            # Custom styles
            title_style = ParagraphStyle(
                "CustomTitle",
                parent=styles["Heading1"],
                fontSize=20,
                textColor=colors.HexColor("#10b981"),
                spaceAfter=30,
                alignment=1,  # Center
                fontName="Helvetica-Bold",
            )

            heading_style = ParagraphStyle(
                "CustomHeading",
                parent=styles["Heading2"],
                fontSize=14,
                textColor=colors.HexColor("#1f2937"),
                spaceAfter=12,
                fontName="Helvetica-Bold",
            )

            normal_style = ParagraphStyle(
                "CustomNormal",
                parent=styles["Normal"],
                fontSize=11,
                textColor=colors.HexColor("#374151"),
                spaceAfter=8,
            )

            # Header
            elements.append(Paragraph("FinAgent", title_style))
            elements.append(Paragraph("Personal Loan Sanction Letter", heading_style))
            elements.append(Spacer(1, 0.2 * inch))

            # Reference details
            try:
                sanction_date = datetime.utcnow()
                validity_date = sanction_date + timedelta(days=self.validity_days)
                logger.debug(
                    f"Sanction date: {sanction_date}, Validity date: {validity_date}"
                )
            except Exception as date_error:
                logger.error(f"Error setting dates: {str(date_error)}")
                raise

            ref_data = [
                ["Sanction Reference No:", loan_id],
                ["Sanction Date:", sanction_date.strftime("%B %d, %Y")],
                [
                    "Validity Date:",
                    validity_date.strftime("%B %d, %Y")
                    + f" ({self.validity_days} days)",
                ],
            ]

            ref_table = Table(ref_data, colWidths=[2.5 * inch, 3.5 * inch])
            ref_table.setStyle(
                TableStyle(
                    [
                        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                        ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
                        ("FONTSIZE", (0, 0), (-1, -1), 10),
                        ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#374151")),
                        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                    ]
                )
            )
            elements.append(ref_table)
            elements.append(Spacer(1, 0.3 * inch))

            # Applicant details
            elements.append(Paragraph("Applicant Details", heading_style))

            user_id = loan_data.get("user_id", "N/A")
            full_name = loan_data.get("full_name", "Valued Customer")

            applicant_data = [
                ["Applicant Name:", full_name],
                ["Customer ID:", user_id],
            ]

            applicant_table = Table(applicant_data, colWidths=[2.5 * inch, 3.5 * inch])
            applicant_table.setStyle(
                TableStyle(
                    [
                        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                        ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
                        ("FONTSIZE", (0, 0), (-1, -1), 10),
                        ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#374151")),
                        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                    ]
                )
            )
            elements.append(applicant_table)
            elements.append(Spacer(1, 0.3 * inch))

            # Loan details
            elements.append(Paragraph("Loan Sanction Details", heading_style))

            approved_amount = loan_data.get("approved_amount", 0)
            tenure = loan_data.get("tenure_months", 0)
            emi = loan_data.get("emi", 0)
            interest_rate = loan_data.get("interest_rate", 0)
            total_payable = loan_data.get("total_payable", emi * tenure)
            processing_fee = loan_data.get("processing_fee", approved_amount * 0.02)

            loan_details_data = [
                ["Sanctioned Amount:", f"₹ {approved_amount:,.2f}"],
                [
                    "Tenure:",
                    f"{tenure} months ({tenure // 12} years {tenure % 12} months)",
                ],
                ["Interest Rate:", f"{interest_rate}% per annum"],
                ["Monthly EMI:", f"₹ {emi:,.2f}"],
                ["Total Amount Payable:", f"₹ {total_payable:,.2f}"],
                ["Processing Fee (2%):", f"₹ {processing_fee:,.2f}"],
                ["Risk Band:", loan_data.get("risk_band", "N/A")],
            ]

            loan_table = Table(loan_details_data, colWidths=[2.5 * inch, 3.5 * inch])
            loan_table.setStyle(
                TableStyle(
                    [
                        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                        ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
                        ("FONTSIZE", (0, 0), (-1, -1), 10),
                        ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#374151")),
                        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                        ("BACKGROUND", (0, -2), (-1, -2), colors.HexColor("#f3f4f6")),
                    ]
                )
            )
            elements.append(loan_table)
            elements.append(Spacer(1, 0.3 * inch))

            # Terms and conditions
            elements.append(Paragraph("Terms & Conditions", heading_style))

            terms = [
                "This sanction is valid for {} days from the date of issue.".format(
                    self.validity_days
                ),
                "The loan is subject to verification of all documents submitted.",
                "Processing fee is non-refundable and payable upfront.",
                "EMI will be deducted on the same date every month.",
                "Prepayment charges may apply as per loan agreement.",
                "Interest rate is fixed for the entire tenure of the loan.",
                "This is a system-generated sanction letter and is valid without signature.",
            ]

            for i, term in enumerate(terms, 1):
                term_text = f"{i}. {term}"
                elements.append(Paragraph(term_text, normal_style))

            elements.append(Spacer(1, 0.3 * inch))

            # Next steps
            elements.append(Paragraph("Next Steps", heading_style))
            next_steps_text = """
            Please submit the following documents to complete your loan processing:
            <br/>• PAN Card<br/>
            • Aadhaar Card<br/>
            • Last 3 months salary slips<br/>
            • Last 6 months bank statements<br/>
            • Address proof<br/>
            <br/>
            Our loan officer will contact you within 2 business days to guide you through the documentation process.
            """
            elements.append(Paragraph(next_steps_text, normal_style))
            elements.append(Spacer(1, 0.3 * inch))

            # Footer
            footer_style = ParagraphStyle(
                "Footer",
                parent=styles["Normal"],
                fontSize=9,
                textColor=colors.HexColor("#6b7280"),
                alignment=1,  # Center
            )

            elements.append(Spacer(1, 0.5 * inch))
            elements.append(
                Paragraph(
                    "This is a system-generated document and does not require a signature.",
                    footer_style,
                )
            )
            elements.append(
                Paragraph(
                    "For queries, contact us at support@finagent.com | +91-1800-XXX-XXXX",
                    footer_style,
                )
            )
            elements.append(
                Paragraph(
                    f"Generated on {datetime.utcnow().strftime('%B %d, %Y at %H:%M UTC')}",
                    footer_style,
                )
            )

            # Build PDF
            try:
                logger.info(f"Building PDF with {len(elements)} elements")
                doc.build(elements)
                logger.info("PDF document built successfully")

                # Verify file was created
                if not os.path.exists(filepath):
                    raise FileNotFoundError(f"PDF file was not created at {filepath}")

                file_size = os.path.getsize(filepath)
                logger.info(
                    f"PDF file created successfully: {filepath} (size: {file_size} bytes)"
                )
            except Exception as build_error:
                logger.error(
                    f"Error building PDF document: {str(build_error)}", exc_info=True
                )
                raise

            # Generate URL (in production, this would be a cloud storage URL)
            pdf_url = f"/api/loan/{loan_id}/sanction-pdf"

            logger.info(f"Generated sanction letter PDF: {filepath}")

            return {"pdf_path": filepath, "pdf_url": pdf_url}

        except Exception as e:
            logger.error(
                f"Error generating PDF for loan {loan_data.get('loan_id', 'unknown')}: {str(e)}",
                exc_info=True,
            )
            raise

    def get_pdf_path(self, loan_id: str) -> str:
        """
        Get the file path for a sanction letter PDF.

        Args:
            loan_id: Loan application ID

        Returns:
            Full file path to the PDF
        """
        filename = f"{loan_id}.pdf"
        return os.path.join(self.output_dir, filename)

    def pdf_exists(self, loan_id: str) -> bool:
        """
        Check if a sanction letter PDF exists.

        Args:
            loan_id: Loan application ID

        Returns:
            True if PDF exists, False otherwise
        """
        filepath = self.get_pdf_path(loan_id)
        return os.path.exists(filepath)

    def delete_pdf(self, loan_id: str) -> bool:
        """
        Delete a sanction letter PDF.

        Args:
            loan_id: Loan application ID

        Returns:
            True if deleted successfully, False otherwise
        """
        try:
            filepath = self.get_pdf_path(loan_id)
            if os.path.exists(filepath):
                os.remove(filepath)
                logger.info(f"Deleted PDF: {filepath}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error deleting PDF: {str(e)}")
            return False


# Singleton instance
pdf_service = PdfService()
