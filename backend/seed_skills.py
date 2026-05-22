"""
Seed the skills and tech_stack tables with Muwafak's full skill set.
Run from the backend directory:  python seed_skills.py
"""
import sqlite3
import json

DB_FILE = "portfolio.db"
USER_ID = 1  # first (and only) user

# Skills (grouped by category, stored as item lists)
SKILLS = [
    {
        "category": "Frontend",
        "items": ["React", "Next.js", "TypeScript", "JavaScript", "HTML5", "CSS3", "Tailwind CSS"],
    },
    {
        "category": "Backend",
        "items": ["Python", "Django", "FastAPI", "REST API"],
    },
    {
        "category": "Databases",
        "items": ["PostgreSQL", "MySQL", "SQLite", "Redis"],
    },
    {
        "category": "Data & AI",
        "items": ["Pandas", "NumPy", "Scikit-learn", "Data Analysis", "Matplotlib"],
    },
    {
        "category": "Tools & Cloud",
        "items": ["Git", "GitHub", "VS Code", "Figma", "Vercel", "Docker"],
    },
]

# Tech Stack (individual entries with name + category)
TECH_STACK = [
    # Frontend
    {"name": "React",        "category": "Frontend",  "icon": ""},
    {"name": "Next.js",      "category": "Frontend",  "icon": ""},
    {"name": "TypeScript",   "category": "Frontend",  "icon": ""},
    {"name": "JavaScript",   "category": "Frontend",  "icon": ""},
    {"name": "HTML5",        "category": "Frontend",  "icon": ""},
    {"name": "CSS3",         "category": "Frontend",  "icon": ""},
    {"name": "Tailwind CSS", "category": "Frontend",  "icon": ""},
    # Backend
    {"name": "Python",       "category": "Backend",   "icon": ""},
    {"name": "FastAPI",      "category": "Backend",   "icon": ""},
    {"name": "Django",       "category": "Backend",   "icon": ""},
    {"name": "REST API",     "category": "Backend",   "icon": ""},
    # Database
    {"name": "PostgreSQL",   "category": "Database",  "icon": ""},
    {"name": "MySQL",        "category": "Database",  "icon": ""},
    {"name": "SQLite",       "category": "Database",  "icon": ""},
    {"name": "Redis",        "category": "Database",  "icon": ""},
    # Cloud / Tools
    {"name": "Git",          "category": "Tools",     "icon": ""},
    {"name": "GitHub",       "category": "Tools",     "icon": ""},
    {"name": "Vercel",       "category": "Cloud",     "icon": ""},
    {"name": "Docker",       "category": "Tools",     "icon": ""},
    {"name": "VS Code",      "category": "Tools",     "icon": ""},
    {"name": "Figma",        "category": "Tools",     "icon": ""},
    # Data & AI
    {"name": "Pandas",       "category": "Tools",     "icon": ""},
    {"name": "NumPy",        "category": "Tools",     "icon": ""},
    {"name": "Scikit-learn", "category": "Tools",     "icon": ""},
    {"name": "Matplotlib",   "category": "Tools",     "icon": ""},
]


def seed():
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()

    # Skills
    print("Clearing existing skills ...")
    cur.execute("DELETE FROM skills WHERE user_id = ?", (USER_ID,))

    print("Inserting skills ...")
    for idx, skill in enumerate(SKILLS):
        cur.execute(
            "INSERT INTO skills (user_id, category, items, sort_order) VALUES (?, ?, ?, ?)",
            (USER_ID, skill["category"], json.dumps(skill["items"]), idx),
        )
        print(f"  [ok] {skill['category']} ({len(skill['items'])} items)")

    # Tech Stack
    print("\nClearing existing tech stack ...")
    cur.execute("DELETE FROM tech_stack WHERE user_id = ?", (USER_ID,))

    print("Inserting tech stack ...")
    for idx, tech in enumerate(TECH_STACK):
        cur.execute(
            "INSERT INTO tech_stack (user_id, name, icon, category, sort_order) VALUES (?, ?, ?, ?, ?)",
            (USER_ID, tech["name"], tech["icon"], tech["category"], idx),
        )
        print(f"  [ok] {tech['name']} ({tech['category']})")

    conn.commit()
    conn.close()
    print(f"\nDone -- {len(SKILLS)} skill categories, {len(TECH_STACK)} tech stack entries seeded.")


if __name__ == "__main__":
    seed()
