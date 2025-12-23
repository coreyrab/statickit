# StaticKit Roadmap

## Planned Features

### Product Placement Tool
**Toolbar position**: After Model, before Export

**Concept**: Allow users to place a different product into the scene while keeping everything else (background, models, lighting) intact.

**Use cases**:
- Swap product variants (different colors, sizes)
- Replace product with competitor comparison
- Test different product photography angles
- Update ads with new product versions

**UI ideas**:
- Upload product image (transparent PNG or auto-remove background)
- Position/scale controls (drag to place, pinch to resize)
- "Match lighting" toggle to adapt product to scene lighting
- Product angle suggestions based on scene perspective

**Technical approach**:
- Inpainting with product mask
- Perspective matching from scene analysis
- Lighting/shadow generation to match environment

---

### Outfit Changes Tool
**Toolbar position**: After Model (or as sub-option within Model tool)

**Concept**: Change the clothing/outfit on models while keeping the person, pose, and background identical.

**Use cases**:
- Test different fashion for same model
- Seasonal variations (summer → winter clothing)
- Brand merchandise placement
- Formal vs casual variations

**UI ideas**:
- Outfit category selector (casual, business, athletic, formal, etc.)
- Color palette picker for outfit
- Reference image upload for specific outfit
- "Keep accessories" toggle (watches, jewelry, etc.)

**Prompt approach**:
```
OUTFIT CHANGE ONLY - Replace the model's clothing while preserving everything else.

OUTFIT REQUEST: [user description]

PROTECT EXACTLY:
- Model's face, hair, pose, expression
- Background and environment
- Lighting and shadows (adapt to new clothing)
- Any accessories unless specified

CHANGE ONLY:
- Clothing items as described
- Adjust fabric folds/draping naturally for the pose
```

---

### Reference Image Feature
See `REFERENCE_IMAGE_PLAN.md` for detailed implementation plan.

**Summary**: Upload a reference image to show (rather than describe) what you want for backgrounds, models, or styles.

---

## Priority Order

1. **Reference Image** - High impact, enables visual communication
2. **Outfit Changes** - Natural extension of Model tool
3. **Product Placement** - More complex, requires precise positioning

---

## Future Ideas (Backlog)

- **Batch processing** - Apply same edit to multiple images
- **Templates** - Save and reuse background/model/style combinations
- **History comparison** - Side-by-side before/after slider
- **Export presets** - One-click export to all platform sizes
- **Team collaboration** - Share projects, comment on versions
- **Brand kit** - Upload brand colors, fonts, logos for consistency
