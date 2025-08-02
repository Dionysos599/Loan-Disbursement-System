import os
import sys
import webview
import json
import tempfile
from datetime import datetime

def get_resource_path(relative_path):
    """Get absolute path to resource, works for dev and for PyInstaller"""
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        # If not PyInstaller, use the current directory
        base_path = os.path.abspath(".")
    
    return os.path.join(base_path, relative_path)

class DownloadAPI:
    def __init__(self):
        self.temp_dir = tempfile.gettempdir()
    
    def download_csv(self, csv_content, filename):
        """Download CSV file to user's download folder"""
        try:
            # Create a temporary file
            temp_file = os.path.join(self.temp_dir, filename)
            with open(temp_file, 'w', encoding='utf-8') as f:
                f.write(csv_content)
            
            # Get user's download folder
            download_folder = os.path.expanduser("~/Downloads")
            
            # Copy to download folder
            final_path = os.path.join(download_folder, filename)
            with open(temp_file, 'r', encoding='utf-8') as src:
                with open(final_path, 'w', encoding='utf-8') as dst:
                    dst.write(src.read())
            
            # Clean up temp file
            os.remove(temp_file)
            
            return {
                'success': True,
                'message': f'File saved to: {final_path}',
                'path': final_path
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'Download failed: {str(e)}'
            }

if __name__ == '__main__':
    try:
        download_api = DownloadAPI()
        
        html_path = get_resource_path('build/index.html')
        
        if not os.path.exists(html_path):
            print(f"Error: HTML file not found at {html_path}")
            print("Current working directory:", os.getcwd())
            print("Available files in current directory:", os.listdir('.'))
            if os.path.exists('lightweight-system'):
                print("Files in lightweight-system:", os.listdir('lightweight-system'))
            input("Press Enter to exit...")
            sys.exit(1)
        
        print(f"Loading HTML from: {html_path}")
        
        window = webview.create_window(
            'Loan Disbursement System', 
            html_path,
            width=1920, 
            height=1080, 
            resizable=True,
            js_api=download_api
        )
        webview.start(window, http_server=True)
        
    except Exception as e:
        print(f"Error starting application: {e}")
        import traceback
        traceback.print_exc()
        input("Press Enter to exit...")
        sys.exit(1)