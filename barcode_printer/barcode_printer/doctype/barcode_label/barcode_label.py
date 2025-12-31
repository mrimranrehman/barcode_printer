import frappe
from frappe.model.document import Document
import barcode
from barcode.writer import ImageWriter
import base64
import os

class BarcodeLabel(Document):
    def generate_barcode(self, item_code, barcode_value=None):
        """Generate barcode image for an item"""
        if not barcode_value:
            barcode_value = item_code
        
        # Generate barcode
        code128 = barcode.get('code128', barcode_value, writer=ImageWriter())
        
        # Save to temp file
        temp_path = frappe.get_site_path('private', 'files', 'barcodes')
        os.makedirs(temp_path, exist_ok=True)
        
        filename = f"{item_code}_{barcode_value}"
        filepath = os.path.join(temp_path, f"{filename}.png")
        
        # Save barcode
        code128.save(filepath)
        
        # Read and encode as base64
        with open(filepath, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode()
        
        # Cleanup
        os.remove(filepath)
        
        return f"data:image/png;base64,{encoded_string}"

@frappe.whitelist()
def get_items_for_barcode(item_group=None, brand=None):
    """Get items for barcode generation"""
    filters = {"disabled": 0}
    
    if item_group:
        filters["item_group"] = item_group
    if brand:
        filters["brand"] = brand
    
    items = frappe.get_all("Item",
        filters=filters,
        fields=["name", "item_name", "item_code", "barcode", "stock_uom"],
        limit=50
    )
    
    return items

@frappe.whitelist()
def generate_labels(item_list, quantity=1):
    """Generate multiple labels for printing"""
    items = frappe.parse_json(item_list)
    labels = []
    
    for item in items:
        for i in range(int(quantity)):
            doc = frappe.new_doc("Barcode Label")
            labels.append({
                "item_code": item.get("item_code"),
                "item_name": item.get("item_name"),
                "barcode": item.get("barcode") or item.get("item_code"),
                "quantity": 1
            })
    
    return labels