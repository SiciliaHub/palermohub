#!/usr/bin/env python3
"""
Script per cercare e sostituire specifici blocchi HTML in tutti i file HTML di una cartella.
Crea automaticamente backup prima delle modifiche.
"""

import os
import shutil
import glob
from datetime import datetime

def create_backup_folder():
    """Crea la cartella di backup se non esistente"""
    if not os.path.exists('bk'):
        os.makedirs('bk')
        print("Cartella 'bk' creata per i backup")

def backup_file(filepath):
    """Crea una copia di backup del file nella cartella bk"""
    filename = os.path.basename(filepath)
    backup_path = os.path.join('bk', filename)
    
    # Se esiste già un backup, aggiunge timestamp
    if os.path.exists(backup_path):
        name, ext = os.path.splitext(filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_path = os.path.join('bk', f"{name}_{timestamp}{ext}")
    
    shutil.copy2(filepath, backup_path)
    print(f"Backup creato: {backup_path}")

def replace_html_content(filepath):
    """Esegue le sostituzioni nel file HTML specificato"""
    with open(filepath, 'r', encoding='utf-8') as file:
        content = file.read()
    
    original_content = content
    changes_made = False
    
    # Prima sostituzione: aggiunge CSS unificato dopo home.css
    old_pattern_1 = '<link rel="stylesheet" href="lib/css/home.css">'
    new_pattern_1 = '''<link rel="stylesheet" href="lib/css/home.css">
	  <!-- NUOVO: CSS unificato -->
    <link rel="stylesheet" href="lib/js/client/css/ph-unified.css">'''
    
    if old_pattern_1 in content:
        content = content.replace(old_pattern_1, new_pattern_1)
        changes_made = True
        print(f"  ✓ Sostituito CSS home.css con versione estesa")
    
    # Seconda sostituzione: aggiunge script centralizzati
    old_pattern_2 = '''    <link rel="stylesheet" href="lib/css/ph-css.css">
    <script src="lib/js/client/ph-header.js"></script>
    <script src="lib/js/client/ph-footer.js"></script>'''
    
    new_pattern_2 = '''    <link rel="stylesheet" href="lib/css/ph-css.css">
    <script src="lib/js/client/ph-header.js"></script>
    <script src="lib/js/client/ph-footer.js"></script>

       <!-- NUOVI: Sistema centralizzato -->
    <script src="lib/js/client/ph-central-manager.js"></script>
    <script src="lib/js/client/ph-patches.js"></script>
    <script src="lib/js/client/ph-init-system.js"></script>'''
    
    if old_pattern_2 in content:
        content = content.replace(old_pattern_2, new_pattern_2)
        changes_made = True
        print(f"  ✓ Sostituiti script esistenti con sistema centralizzato")
    
    # Salva le modifiche solo se sono stati fatti cambiamenti
    if changes_made:
        with open(filepath, 'w', encoding='utf-8') as file:
            file.write(content)
        return True
    
    return False

def process_html_files(folder_path='.'):
    """Processa tutti i file HTML nella cartella specificata"""
    print(f"Cercando file HTML in: {os.path.abspath(folder_path)}")
    
    # Trova tutti i file HTML
    html_files = glob.glob(os.path.join(folder_path, '*.html'))
    
    if not html_files:
        print("Nessun file HTML trovato nella cartella corrente")
        return
    
    print(f"Trovati {len(html_files)} file HTML")
    
    # Crea cartella di backup
    create_backup_folder()
    
    modified_files = 0
    
    for html_file in html_files:
        print(f"\nProcessando: {html_file}")
        
        # Crea backup
        backup_file(html_file)
        
        # Esegue sostituzioni
        if replace_html_content(html_file):
            modified_files += 1
            print(f"  ✓ File modificato con successo")
        else:
            print(f"  - Nessuna modifica necessaria")
    
    print(f"\n" + "="*50)
    print(f"RIEPILOGO:")
    print(f"File processati: {len(html_files)}")
    print(f"File modificati: {modified_files}")
    print(f"Backup salvati in: ./bk/")
    print("="*50)

def main():
    """Funzione principale"""
    print("Script di sostituzione HTML avviato")
    print("-" * 40)
    
    try:
        # Puoi cambiare il percorso qui se necessario
        folder_path = input("Inserisci il percorso della cartella (premi Enter per cartella corrente): ").strip()
        if not folder_path:
            folder_path = '.'
        
        if not os.path.exists(folder_path):
            print(f"Errore: La cartella '{folder_path}' non esiste")
            return
        
        process_html_files(folder_path)
        
    except KeyboardInterrupt:
        print("\n\nOperazione annullata dall'utente")
    except Exception as e:
        print(f"\nErrore durante l'esecuzione: {e}")

if __name__ == "__main__":
    main()
