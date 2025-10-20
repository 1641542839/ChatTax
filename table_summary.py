"""
Summarize tables extracted from documents.
Creates natural language summaries of tabular data.
"""

import os
import csv
from pathlib import Path
from tqdm import tqdm
import json


class TableSummarizer:
    """Summarize tabular data for better retrieval."""
    
    def __init__(self, table_dir="./data/tables", output_dir="./data/parsed"):
        self.table_dir = table_dir
        self.output_dir = output_dir
    
    def read_csv_table(self, csv_path):
        """
        Read CSV file and return as list of lists.
        
        Args:
            csv_path: Path to CSV file
            
        Returns:
            List of rows, where each row is a list of cells
        """
        try:
            with open(csv_path, 'r', encoding='utf-8') as f:
                reader = csv.reader(f)
                return list(reader)
        except Exception as e:
            print(f"Error reading {csv_path}: {str(e)}")
            return []
    
    def detect_header_row(self, table):
        """
        Try to detect if first row is a header.
        
        Args:
            table: List of rows
            
        Returns:
            Boolean indicating if first row is likely a header
        """
        if not table or len(table) < 2:
            return False
        
        first_row = table[0]
        second_row = table[1]
        
        # Check if first row has more text and less numbers than second row
        first_has_numbers = sum(1 for cell in first_row if any(c.isdigit() for c in cell))
        second_has_numbers = sum(1 for cell in second_row if any(c.isdigit() for c in cell))
        
        return first_has_numbers < second_has_numbers
    
    def summarize_table(self, table, table_name):
        """
        Create a natural language summary of a table.
        
        Args:
            table: List of rows (each row is a list of cells)
            table_name: Name/identifier for the table
            
        Returns:
            Dictionary with summary information
        """
        if not table or len(table) == 0:
            return None
        
        num_rows = len(table)
        num_cols = len(table[0]) if table else 0
        
        # Detect header
        has_header = self.detect_header_row(table)
        
        summary = {
            'table_name': table_name,
            'dimensions': f"{num_rows} rows x {num_cols} columns",
            'num_rows': num_rows,
            'num_cols': num_cols,
            'has_header': has_header
        }
        
        # Extract column headers
        if has_header:
            summary['headers'] = table[0]
            data_rows = table[1:]
        else:
            summary['headers'] = [f"Column {i+1}" for i in range(num_cols)]
            data_rows = table
        
        # Create textual summary
        text_parts = [f"Table: {table_name}"]
        text_parts.append(f"This table contains {num_rows} rows and {num_cols} columns.")
        
        if has_header:
            text_parts.append(f"Column headers: {', '.join(summary['headers'])}")
        
        # Sample first few rows
        sample_size = min(3, len(data_rows))
        if sample_size > 0:
            text_parts.append(f"\nFirst {sample_size} rows:")
            for i, row in enumerate(data_rows[:sample_size]):
                row_text = " | ".join(str(cell) for cell in row)
                text_parts.append(f"Row {i+1}: {row_text}")
        
        # Analyze data types in columns
        if data_rows:
            column_types = []
            for col_idx in range(num_cols):
                col_values = [row[col_idx] for row in data_rows if col_idx < len(row)]
                numeric_count = sum(1 for v in col_values if self._is_numeric(v))
                
                if numeric_count > len(col_values) * 0.7:
                    column_types.append("numeric")
                else:
                    column_types.append("text")
            
            summary['column_types'] = column_types
        
        summary['text_summary'] = '\n'.join(text_parts)
        
        return summary
    
    def _is_numeric(self, value):
        """Check if a value is numeric."""
        try:
            float(str(value).replace(',', '').replace('$', ''))
            return True
        except (ValueError, AttributeError):
            return False
    
    def process_table(self, csv_path):
        """
        Process a single table CSV file.
        
        Args:
            csv_path: Path to CSV file
            
        Returns:
            Dictionary with table summary
        """
        table = self.read_csv_table(csv_path)
        
        if not table:
            return None
        
        table_name = Path(csv_path).stem
        summary = self.summarize_table(table, table_name)
        
        return summary
    
    def process_all_tables(self):
        """Process all CSV tables and create summaries."""
        if not os.path.exists(self.table_dir):
            print(f"Table directory does not exist: {self.table_dir}")
            return
        
        # Find all CSV files
        csv_files = list(Path(self.table_dir).glob('*.csv'))
        
        if not csv_files:
            print("No CSV files found")
            return
        
        print(f"Processing {len(csv_files)} tables...")
        
        os.makedirs(self.output_dir, exist_ok=True)
        
        summaries = []
        for csv_path in tqdm(csv_files, desc="Summarizing tables"):
            try:
                summary = self.process_table(csv_path)
                
                if summary:
                    summaries.append(summary)
                    
                    # Save individual summary as JSON
                    output_filename = csv_path.stem + '_summary.json'
                    output_path = os.path.join(self.output_dir, output_filename)
                    
                    with open(output_path, 'w', encoding='utf-8') as f:
                        json.dump(summary, f, indent=2, ensure_ascii=False)
                        
            except Exception as e:
                print(f"Error processing {csv_path}: {str(e)}")
        
        # Save combined summary
        combined_output = os.path.join(self.output_dir, 'all_tables_summary.json')
        with open(combined_output, 'w', encoding='utf-8') as f:
            json.dump(summaries, f, indent=2, ensure_ascii=False)
        
        print(f"Created summaries for {len(summaries)} tables")


def main():
    """Main function to summarize tables."""
    summarizer = TableSummarizer()
    
    print("Starting table summarization...")
    summarizer.process_all_tables()
    print("Summarization completed!")


if __name__ == "__main__":
    main()
