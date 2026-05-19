# 🚀 SUPER SIMPELE SETUP GIDS

## STAP 1: GitHub Repository aanmaken (5 minuten)

1. **Ga naar github.com** en log in
2. **Klik "+" bovenin → "New repository"**
3. **Vul in:**
   - Repository name: `firstgear-pdf-converter`
   - Description: `Voertuig PDF naar TXT converter`
   - Public (aanklikken!)
4. **Klik "Create repository"**
5. **KLAAR! Je hebt een leeg repository**

---

## STAP 2: Bestanden uploaden naar GitHub

Je hebt deze bestanden nodig in je repository:

```
📁 firstgear-pdf-converter/
  ├── 📄 package.json (zie bestanden)
  ├── 📄 next.config.js (zie bestanden)
  ├── 📄 .gitignore (zie bestanden)
  ├── 📄 README.md (zie bestanden)
  ├── 📁 pages/
  │   ├── 📄 index.jsx (rename page.jsx to this)
  │   └── 📁 api/
  │       └── 📄 convert-pdf.js (use improved version)
```

### Hoe uploaden:

**Manier 1 (Easiest - via GitHub website):**

1. Open je repository op GitHub
2. Klik groene "Code" knop → "Upload files"
3. Sleep bestanden in de upload area
4. Klik "Commit changes"
5. **KLAAR!**

**Manier 2 (via Command Line - als je dit kent):**

```bash
git clone https://github.com/jouwusername/firstgear-pdf-converter.git
cd firstgear-pdf-converter

# Zet alle bestanden hier in
# pages/index.jsx
# pages/api/convert-pdf.js
# package.json
# next.config.js
# .gitignore
# README.md

git add .
git commit -m "Initial commit"
git push origin main
```

---

## STAP 3: Deploy naar Vercel

1. **Ga naar vercel.com** en log in
2. **Klik "Add New Project"**
3. **Klik "Continue with GitHub"**
4. **Zoek je repository: "firstgear-pdf-converter"**
5. **Klik "Import"**
6. **Vercel stelt vragen - klik allemaal "Continue" / "Deploy"**
7. **⏳ Wacht 1-2 minuten... KLAAR!**

Je krijgt automatisch een live URL! 🎉

---

## BESTANDEN CHECKLIST

Zorg dat je deze bestanden hebt:

- [ ] package.json
- [ ] next.config.js
- [ ] .gitignore
- [ ] README.md
- [ ] pages/index.jsx
- [ ] pages/api/convert-pdf.js

---

## KLAAR?

Je app is nu live! Ga naar je Vercel URL en:

1. Sleep een PDF erin
2. Download je TXT-bestand
3. **BOOM - KLAAR!** 🚀

---

## Problemen?

**App laadt niet:**
- Wacht 2-3 minuten (deployment loopt)
- Refresh de pagina

**Upload werkt niet:**
- Zorg dat het een PDF is
- Bestand moet < 50MB zijn

**Meer hulp:**
- Check de Vercel logs
- Or ping me!

---

## Succes! 🎉
