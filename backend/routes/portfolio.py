from typing import Any
from fastapi import APIRouter, HTTPException, status, Depends
import json

from auth import get_current_user
from database import execute_query, execute_returning
from schemas import (
    PortfolioResponse, ProfileResponse, AboutResponse, ContactInfoResponse,
    SkillResponse, ProjectResponse, EducationResponse, ExperienceResponse,
    TechStackResponse, ProfileUpdate, AboutUpdate, ContactInfoUpdate,
    SkillCreate, SkillUpdate, ProjectCreate, ProjectUpdate,
    EducationCreate, EducationUpdate, ExperienceCreate, ExperienceUpdate,
    TechStackCreate, TechStackUpdate
)

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])


def parse_json_field(value, default=None):
    """Parse JSON string from database, return default if None or invalid."""
    if value is None:
        return default
    if isinstance(value, (list, dict)):
        return value
    try:
        return json.loads(value) if isinstance(value, str) else value
    except (json.JSONDecodeError, TypeError):
        return default


def get_first_user_id():
    """Get the first user ID (for single-user portfolio)."""
    user = execute_query("SELECT id FROM users LIMIT 1", fetch_one=True)
    return user["id"] if user else None


@router.get("", response_model=PortfolioResponse)
async def get_portfolio():
    """Get complete portfolio data."""
    user_id = get_first_user_id()
    
    if not user_id:
        # Return empty portfolio if no user exists
        return PortfolioResponse(
            profile=ProfileResponse(),
            about=AboutResponse(),
            contact=ContactInfoResponse(),
            skills=[],
            projects=[],
            education=[],
            experience=[],
            techStack=[]
        )
    
    # Fetch profile
    profile_row = execute_query(
        "SELECT * FROM profiles WHERE user_id = %s",
        (user_id,),
        fetch_one=True
    )
    profile = ProfileResponse(
        name=profile_row.get("name") if profile_row else None,
        title=profile_row.get("title") if profile_row else None,
        bio=profile_row.get("bio") if profile_row else None,
        resume=profile_row.get("resume_url") if profile_row else None,
        profileImage=profile_row.get("profile_image_url") if profile_row else None,
        location=profile_row.get("location") if profile_row else None,
        languages=profile_row.get("languages") if profile_row else None,
        email=profile_row.get("email") if profile_row else None
    )
    
    # Fetch about
    about_row = execute_query(
        "SELECT * FROM about_sections WHERE user_id = %s",
        (user_id,),
        fetch_one=True
    )
    about = AboutResponse(
        description=about_row.get("description") if about_row else None,
        highlights=parse_json_field(about_row.get("highlights"), []) if about_row else []
    )
    
    # Fetch contact info
    contact_row = execute_query(
        "SELECT * FROM contact_info WHERE user_id = %s",
        (user_id,),
        fetch_one=True
    )
    # Get email from profile
    contact = ContactInfoResponse(
        email=profile_row.get("email") if profile_row else None,
        phone=contact_row.get("phone") if contact_row else None,
        social=parse_json_field(contact_row.get("social_links"), {}) if contact_row else {}
    )
    
    # Fetch skills
    skills_rows = execute_query(
        "SELECT * FROM skills WHERE user_id = %s ORDER BY sort_order",
        (user_id,),
        fetch_all=True
    ) or []
    skills = [
        SkillResponse(_id=str(row["id"]), category=row["category"], items=parse_json_field(row.get("items"), []))
        for row in skills_rows
    ]
    
    # Fetch projects
    projects_rows = execute_query(
        "SELECT * FROM projects WHERE user_id = %s ORDER BY sort_order",
        (user_id,),
        fetch_all=True
    ) or []
    projects = [
        ProjectResponse(
            _id=str(row["id"]),
            title=row["title"],
            description=row.get("description"),
            image=row.get("image_url"),
            technologies=parse_json_field(row.get("technologies"), []),
            liveUrl=row.get("live_url"),
            githubUrl=row.get("github_url"),
            featured=row.get("featured", False)
        )
        for row in projects_rows
    ]
    
    # Fetch education
    education_rows = execute_query(
        "SELECT * FROM education WHERE user_id = %s ORDER BY sort_order",
        (user_id,),
        fetch_all=True
    ) or []
    education = [
        EducationResponse(
            _id=str(row["id"]),
            institution=row["institution"],
            degree=row.get("degree"),
            field=row.get("field"),
            description=row.get("description")
        )
        for row in education_rows
    ]
    
    # Fetch experience
    experience_rows = execute_query(
        "SELECT * FROM experience WHERE user_id = %s ORDER BY sort_order",
        (user_id,),
        fetch_all=True
    ) or []
    experience = [
        ExperienceResponse(
            _id=str(row["id"]),
            company=row["company"],
            position=row["position"],
            startDate=str(row["start_date"]) if row.get("start_date") else None,
            endDate=str(row["end_date"]) if row.get("end_date") else None,
            current=row.get("is_current", False),
            description=row.get("description"),
            technologies=parse_json_field(row.get("technologies"), [])
        )
        for row in experience_rows
    ]
    
    # Fetch tech stack
    techstack_rows = execute_query(
        "SELECT * FROM tech_stack WHERE user_id = %s ORDER BY sort_order",
        (user_id,),
        fetch_all=True
    ) or []
    techStack = [
        TechStackResponse(
            _id=str(row["id"]),
            name=row["name"],
            icon=row.get("icon"),
            category=row.get("category")
        )
        for row in techstack_rows
    ]
    
    return PortfolioResponse(
        profile=profile,
        about=about,
        contact=contact,
        skills=skills,
        projects=projects,
        education=education,
        experience=experience,
        techStack=techStack
    )


@router.put("/section/{section}")
async def update_section(section: str, data: dict, current_user: dict = Depends(get_current_user)):
    """Update a specific portfolio section."""
    user_id = current_user["id"]
    
    if section == "profile":
        # Update profile
        update_data = data
        execute_query(
            """
            UPDATE profiles SET
                name = COALESCE(%s, name),
                title = COALESCE(%s, title),
                bio = COALESCE(%s, bio),
                resume_url = COALESCE(%s, resume_url),
                profile_image_url = COALESCE(%s, profile_image_url),
                location = COALESCE(%s, location),
                languages = COALESCE(%s, languages),
                email = COALESCE(%s, email),
                updated_at = NOW()
            WHERE user_id = %s
            """,
            (
                update_data.get("name"),
                update_data.get("title"),
                update_data.get("bio"),
                update_data.get("resume"),
                update_data.get("profileImage"),
                update_data.get("location"),
                update_data.get("languages"),
                update_data.get("email"),
                user_id
            )
        )
        return {"message": "Profile updated successfully"}
    
    elif section == "about":
        highlights = data.get("highlights", [])
        execute_query(
            """
            UPDATE about_sections SET
                description = COALESCE(%s, description),
                highlights = %s,
                updated_at = NOW()
            WHERE user_id = %s
            """,
            (data.get("description"), json.dumps(highlights), user_id)
        )
        return {"message": "About section updated successfully"}
    
    elif section == "contact":
        social = data.get("social", {})
        # Update contact_info
        execute_query(
            """
            UPDATE contact_info SET
                phone = COALESCE(%s, phone),
                social_links = %s,
                updated_at = NOW()
            WHERE user_id = %s
            """,
            (data.get("phone"), json.dumps(social), user_id)
        )
        # Also update email in profile
        if data.get("email"):
            execute_query(
                "UPDATE profiles SET email = %s WHERE user_id = %s",
                (data.get("email"), user_id)
            )
        return {"message": "Contact info updated successfully"}
    
    elif section == "skills":
        # Replace all skills
        skills_data = data if isinstance(data, list) else data.get("skills", [])
        execute_query("DELETE FROM skills WHERE user_id = %s", (user_id,))
        for idx, skill in enumerate(skills_data):
            items = skill.get("items", [])
            execute_returning(
                """
                INSERT INTO skills (user_id, category, items, sort_order)
                VALUES (%s, %s, %s, %s) RETURNING id
                """,
                (user_id, skill.get("category"), json.dumps(items), idx)
            )
        return {"message": "Skills updated successfully"}
    
    elif section == "projects":
        # Replace all projects
        projects_data = data if isinstance(data, list) else data.get("projects", [])
        execute_query("DELETE FROM projects WHERE user_id = %s", (user_id,))
        for idx, project in enumerate(projects_data):
            techs = project.get("technologies", [])
            execute_returning(
                """
                INSERT INTO projects (user_id, title, description, image_url, technologies, live_url, github_url, featured, sort_order)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
                """,
                (
                    user_id,
                    project.get("title"),
                    project.get("description"),
                    project.get("image"),
                    json.dumps(techs),
                    project.get("liveUrl"),
                    project.get("githubUrl"),
                    project.get("featured", False),
                    idx
                )
            )
        return {"message": "Projects updated successfully"}
    
    elif section == "education":
        # Replace all education
        education_data = data if isinstance(data, list) else data.get("education", [])
        execute_query("DELETE FROM education WHERE user_id = %s", (user_id,))
        for idx, edu in enumerate(education_data):
            execute_returning(
                """
                INSERT INTO education (user_id, institution, degree, field, description, sort_order)
                VALUES (%s, %s, %s, %s, %s, %s) RETURNING id
                """,
                (
                    user_id,
                    edu.get("institution"),
                    edu.get("degree"),
                    edu.get("field"),
                    edu.get("description"),
                    idx
                )
            )
        return {"message": "Education updated successfully"}
    
    elif section == "experience":
        # Replace all experience
        experience_data = data if isinstance(data, list) else data.get("experience", [])
        execute_query("DELETE FROM experience WHERE user_id = %s", (user_id,))
        for idx, exp in enumerate(experience_data):
            techs = exp.get("technologies", [])
            start_date = exp.get("startDate")
            end_date = exp.get("endDate")
            execute_returning(
                """
                INSERT INTO experience (user_id, company, position, start_date, end_date, is_current, description, technologies, sort_order)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
                """,
                (
                    user_id,
                    exp.get("company"),
                    exp.get("position"),
                    start_date if start_date else None,
                    end_date if end_date else None,
                    exp.get("current", False),
                    exp.get("description"),
                    json.dumps(techs),
                    idx
                )
            )
        return {"message": "Experience updated successfully"}
    
    elif section == "techStack":
        # Replace all tech stack
        techstack_data = data if isinstance(data, list) else data.get("techStack", [])
        execute_query("DELETE FROM tech_stack WHERE user_id = %s", (user_id,))
        for idx, tech in enumerate(techstack_data):
            execute_returning(
                """
                INSERT INTO tech_stack (user_id, name, icon, category, sort_order)
                VALUES (%s, %s, %s, %s, %s) RETURNING id
                """,
                (
                    user_id,
                    tech.get("name"),
                    tech.get("icon"),
                    tech.get("category"),
                    idx
                )
            )
        return {"message": "Tech stack updated successfully"}
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown section: {section}"
        )


@router.put("")
async def update_portfolio(data: dict, current_user: dict = Depends(get_current_user)):
    """Update entire portfolio."""
    user_id = current_user["id"]
    
    # Update each section if provided
    if "profile" in data:
        await update_section("profile", data["profile"], current_user)
    if "about" in data:
        await update_section("about", data["about"], current_user)
    if "contact" in data:
        await update_section("contact", data["contact"], current_user)
    if "skills" in data:
        await update_section("skills", data["skills"], current_user)
    if "projects" in data:
        await update_section("projects", data["projects"], current_user)
    if "education" in data:
        await update_section("education", data["education"], current_user)
    if "experience" in data:
        await update_section("experience", data["experience"], current_user)
    if "techStack" in data:
        await update_section("techStack", data["techStack"], current_user)
    
    return {"message": "Portfolio updated successfully"}
