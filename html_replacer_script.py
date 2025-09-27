#!/usr/bin/env python3
"""
Script per cercare e sostituire codice HTML specifico nei file .html
Prima della sostituzione crea backup nella cartella 'bk'
"""

import os
import shutil
import glob
import re
from pathlib import Path

def create_backup_folder(folder_path):
    """Crea la cartella di backup se non esiste"""
    backup_folder = os.path.join(folder_path, 'bk')
    if not os.path.exists(backup_folder):
        os.makedirs(backup_folder)
        print(f"Creata cartella backup: {backup_folder}")
    return backup_folder

def backup_file(file_path, backup_folder):
    """Crea una copia di backup del file"""
    filename = os.path.basename(file_path)
    backup_path = os.path.join(backup_folder, filename)
    
    # Se esiste già un backup con lo stesso nome, aggiungi un numero
    counter = 1
    original_backup_path = backup_path
    while os.path.exists(backup_path):
        name, ext = os.path.splitext(original_backup_path)
        backup_path = f"{name}_{counter}{ext}"
        counter += 1
    
    shutil.copy2(file_path, backup_path)
    print(f"Backup creato: {backup_path}")
    return backup_path

def replace_html_content(file_path):
    """Sostituisce il contenuto HTML nel file specificato"""
    
    # Pattern da cercare (più flessibile con spazi bianchi)
    old_pattern = r'<link\s+rel="stylesheet"\s+href="lib/css/ph-css\.css">\s*<script\s+src="lib/js/client/ph-header\.js"></script>\s*<script\s+src="lib/js/client/ph-footer\.js"></script>'
    
    # Contenuto di sostituzione
    new_content = '''<link rel="stylesheet" href="lib/css/ph-css.css">
    <script src="lib/js/client/ph-header.js"></script>
    <script src="lib/js/client/ph-footer.js"></script>

       <!-- NUOVI: Sistema centralizzato -->
    <script src="lib/js/client/ph-central-manager.js"></script>
    <script src="lib/js/client/ph-patches.js"></script>
    <script src="lib/js/client/ph-init-system.js"></script>'''
    
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Verifica se il pattern esiste nel file
        if re.search(old_pattern, content, re.IGNORECASE | re.MULTILINE):
            # Esegui la sostituzione
            new_file_content = re.sub(old_pattern, new_content, content, flags=re.IGNORECASE | re.MULTILINE)
            
            # Scrivi il file modificato
            with open(file_path, 'w', encoding='utf-8') as file:
                file.write(new_file_content)
            
            return True
        else:
            return False
            
    except Exception as e:
        print(f"Errore durante la lettura/scrittura del file {file_path}: {e}")
        return False

def process_html_files(folder_path):
    """Processa tutti i file HTML nella cartella specificata"""
    
    if not os.path.exists(folder_path):
        print(f"Errore: La cartella '{folder_path}' non esiste!")
        return
    
    # Crea cartella di backup
    backup_folder = create_backup_folder(folder_path)
    
    # Trova tutti i file HTML
    html_pattern = os.path.join(folder_path, "*.html")
    html_files = glob.glob(html_pattern)
    
    if not html_files:
        print(f"Nessun file HTML trovato nella cartella '{folder_path}'")
        return
    
    print(f"Trovati {len(html_files)} file HTML da processare...")
    
    processed_count = 0
    
    for html_file in html_files:
        print(f"\nProcessando: {html_file}")
        
        # Leggi il file per verificare se contiene il pattern da sostituire
        try:
            with open(html_file, 'r', encoding='utf-8') as file:
                content = file.read()
            
            # Pattern più semplice per la verifica iniziale
            if ('ph-css.css' in content and 'ph-header.js' in content and 'ph-footer.js' in content and
                'ph-central-manager.js' not in content):
                
                # Crea backup prima della modifica
                backup_file(html_file, backup_folder)
                
                # Sostituisci il contenuto
                if replace_html_content(html_file):
                    print(f"✓ File modificato con successo: {html_file}")
                    processed_count += 1
                else:
                    print(f"⚠ Pattern non trovato o errore nella sostituzione: {html_file}")
            else:
                if 'ph-central-manager.js' in content:
                    print(f"○ File già aggiornato: {html_file}")
                else:
                    print(f"○ File non contiene i pattern richiesti: {html_file}")
                    
        except Exception as e:
            print(f"Errore durante la lettura del file {html_file}: {e}")
    
    print(f"\n=== RIEPILOGO ===")
    print(f"File processati con successo: {processed_count}")
    print(f"Backup salvati in: {backup_folder}")

def main():
    """Funzione principale"""
    print("=== Script di Sostituzione HTML ===")
    
    # Chiedi all'utente la cartella da processare
    folder_path = input("Inserisci il percorso della cartella contenente i file HTML (oppure '.' per la cartella corrente): ").strip()
    
    if folder_path == '.' or folder_path == '':
        folder_path = os.getcwd()
    
    print(f"Cartella selezionata: {folder_path}")
    
    # Conferma prima di procedere
    confirm = input("Procedere con la sostituzione? (s/n): ").strip().lower()
    
    if confirm in ['s', 'si', 'y', 'yes']:
        process_html_files(folder_path)
    else:
        print("Operazione annullata.")

if __name__ == "__main__":
    main()