from ...core.exceptions import SlidesContentValidationError

PLACEHOLDER_STRINGS = {"...", "placeholder", "tbd", "todo", "lorem ipsum"}

BULLET_RULES = {
    "title":   (1, 2),
    "content": (3, 7),
    "closing": (2, 4),
}

def validate_slides_content(data: list, outline: list) -> None:
    if not isinstance(data, list):
        raise SlidesContentValidationError("Content must be a JSON array.")

    if len(data) != len(outline):
        raise SlidesContentValidationError(
            f"Expected {len(outline)} slides, got {len(data)}."
        )

    outline_by_position = {item["position"]: item for item in outline}

    for i, item in enumerate(data):
        if not isinstance(item, dict):
            raise SlidesContentValidationError(f"Item {i} is not an object.")

        for key in ("position", "slide_type", "title", "bullets"):
            if key not in item:
                raise SlidesContentValidationError(
                    f"Item {i} missing field '{key}'."
                )

        position = item["position"]
        outline_item = outline_by_position.get(position)

        if not outline_item:
            raise SlidesContentValidationError(
                f"Item {i} has position {position} which does not exist in outline."
            )

        if item["title"].strip() != outline_item["title"].strip():
            raise SlidesContentValidationError(
                f"Item at position {position} has title '{item['title']}', "
                f"expected '{outline_item['title']}' from outline."
            )

        if item["slide_type"] != outline_item["slide_type"]:
            raise SlidesContentValidationError(
                f"Item at position {position} has slide_type '{item['slide_type']}', "
                f"expected '{outline_item['slide_type']}' from outline."
            )

        bullets = item["bullets"]
        if not isinstance(bullets, list):
            raise SlidesContentValidationError(
                f"Item at position {position} has invalid 'bullets' (must be array)."
            )

        slide_type = item["slide_type"]
        min_b, max_b = BULLET_RULES[slide_type]

        if not (min_b <= len(bullets) <= max_b):
            raise SlidesContentValidationError(
                f"Slide at position {position} ('{slide_type}') must have "
                f"{min_b}–{max_b} bullets, got {len(bullets)}."
            )

        for j, bullet in enumerate(bullets):
            if not isinstance(bullet, str) or not bullet.strip():
                raise SlidesContentValidationError(
                    f"Slide at position {position}, bullet {j} is empty or invalid."
                )
            if bullet.strip().lower() in PLACEHOLDER_STRINGS:
                raise SlidesContentValidationError(
                    f"Slide at position {position}, bullet {j} looks like a placeholder: '{bullet}'."
                )