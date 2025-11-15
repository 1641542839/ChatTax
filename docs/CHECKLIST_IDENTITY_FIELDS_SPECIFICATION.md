# 📋 ChecklistIdentityInfo Field Specification

**Document Purpose**: Complete specification for checklist generation fields  
**Target Audience**: GitHub Copilot, AI assistants, developers  
**Status**: MVP v1.0 (Current) + Future Enhancement Plan  
**Last Updated**: 2025-11-15

---

## 🎯 Document Overview

This document defines the complete field structure for `ChecklistIdentityInfo` used in Australian personal tax checklist generation. It includes:
1. **Current MVP fields** (what exists now)
2. **Recommended additions** (what should be added)
3. **Field mapping** (frontend form → backend schema)
4. **Implementation notes** for AI-assisted development

---

## 📊 Current MVP Fields (v1.0)

### Core Fields (Required)

| Field | Type | Form Name | Values | Currently Used |
|-------|------|-----------|--------|----------------|
| `employment_status` | string | `employmentStatus` | employed, self_employed, contractor, retired, student, unemployed | ✅ Yes |
| `income_sources` | array | `incomeSources` | salary, self_employment, investment, rental, superannuation, foreign, government, other | ✅ Yes |
| `has_dependents` | boolean | `hasDependents` | true/false | ✅ Yes |
| `has_investment` | boolean | `hasInvestment` | true/false | ✅ Yes |
| `has_rental_property` | boolean | `hasRentalProperty` | true/false | ✅ Yes |
| `is_first_time_filer` | boolean | `isFirstTimeFiler` | true/false | ✅ Yes |

### Additional Info Fields (Optional in MVP)

These are currently in the form but mapped to `additional_info` dict:

| Field | Type | Form Name | Currently Collected |
|-------|------|-----------|-------------------|
| `residency_status` | string | `residencyStatus` | ✅ Yes (NEW - just added) |
| `has_home_office` | boolean | `hasHomeOffice` | ✅ Yes |
| `has_foreign_income` | boolean | `hasForeignIncome` | ✅ Yes |
| `has_charity_donations` | boolean | `hasCharityDonations` | ✅ Yes |
| `has_private_health_insurance` | boolean | `hasPrivateHealthInsurance` | ✅ Yes |
| `has_hecs_debt` | boolean | `hasHECSDebt` | ✅ Yes |
| `has_work_expenses` | boolean | `hasWorkExpenses` | ✅ Yes (form field exists) |
| `number_of_dependents` | number | `numberOfDependents` | ✅ Yes (conditional) |
| `number_of_properties` | number | `numberOfProperties` | ✅ Yes (conditional) |
| `has_crypto_currency` | boolean | `hasCryptoCurrency` | ✅ Yes |
| `has_super_contributions` | boolean | `hasSuperContributions` | ✅ Yes |
| `has_sold_home` | boolean | `hasSoldHome` | ✅ Yes |
| `has_child_care_expenses` | boolean | `hasChildCareExpenses` | ✅ Yes |
| `has_adoption_expenses` | boolean | `hasAdoptionExpenses` | ✅ Yes |
| `additional_notes` | string | `additionalNotes` | ✅ Yes |

---

## 🔍 Current Field Mapping Issue

### ⚠️ Problem: Inconsistent Structure

**Frontend Form** collects many fields but only sends 6 core fields + `additional_info` dict:

```typescript
// Current structure sent to backend:
{
  employment_status: "employed",
  income_sources: ["salary"],
  has_dependents: false,
  has_investment: false,
  has_rental_property: false,
  is_first_time_filer: false,
  additional_info: {
    residency_status: "resident",
    has_home_office: false,
    has_foreign_income: false,
    has_charity_donations: false,
    has_private_health_insurance: false,
    has_hecs_debt: false,
    has_work_expenses: false,
    // ... all other fields
  }
}
```

### ❌ Issue
The LLM prompt only uses the 6 core fields directly. Fields in `additional_info` are passed as a generic dict and **may not be effectively used** for personalization.

---

## ✅ Recommended Field Structure (Enhanced MVP)

### Approach: Promote Key Fields to Top Level

Based on Australian tax expert analysis, these fields should be **promoted from `additional_info` to top-level** because they significantly impact checklist generation:

```typescript
interface ChecklistIdentityInfo {
  // === CORE FIELDS (existing) ===
  employment_status: string                    // ✅ Already top-level
  income_sources: string[]                     // ✅ Already top-level
  has_dependents: boolean                      // ✅ Already top-level
  has_investment: boolean                      // ✅ Already top-level
  has_rental_property: boolean                 // ✅ Already top-level
  is_first_time_filer: boolean                 // ✅ Already top-level
  
  // === HIGH PRIORITY - Promote to Top Level ===
  residency_status: "resident" | "foreign_resident" | "working_holiday_maker"  // 🔥 CRITICAL
  has_work_related_expenses: boolean           // 🔥 80%+ of taxpayers claim
  has_private_health_insurance: boolean        // 🔥 Affects MLS & rebate
  has_hecs_debt: boolean                       // 🔥 Affects PAYG withholding
  
  // === MEDIUM PRIORITY - Promote to Top Level ===
  has_capital_gains: boolean                   // 📈 For investors
  has_charity_donations: boolean               // 📈 Common deduction
  has_foreign_income: boolean                  // 📈 Increases complexity
  has_personal_super_contributions: boolean    // 📈 Tax optimization
  
  // === SUPPORTING DETAILS ===
  additional_info?: {
    // Quantitative details
    number_of_dependents?: number
    number_of_rental_properties?: number
    
    // Location & context
    state?: "NSW" | "VIC" | "QLD" | "WA" | "SA" | "TAS" | "NT" | "ACT"
    industry?: string
    
    // Specific deductions/situations
    has_home_office?: boolean
    has_crypto?: boolean
    has_vehicle_expenses?: boolean
    has_education_expenses?: boolean
    has_multiple_jobs?: boolean
    
    // Less common situations
    has_child_care_expenses?: boolean
    has_adoption_expenses?: boolean
    has_sold_home?: boolean
    
    // Free text
    additional_notes?: string
  }
}
```

---

## 📝 Implementation Checklist for AI Assistant

When asked to "update checklist generation fields", follow this checklist:

### Phase 1: Backend Schema Update

**File**: `Backend/app/schemas/schemas.py`

- [ ] Update `ChecklistIdentityInfo` class
- [ ] Add new top-level fields with proper types
- [ ] Update docstrings and examples
- [ ] Ensure backward compatibility (Optional fields)

```python
class ChecklistIdentityInfo(BaseModel):
    """Schema for checklist generation - Australian personal tax."""
    
    # Core fields (existing)
    employment_status: str
    income_sources: List[str]
    has_dependents: Optional[bool] = None
    has_investment: Optional[bool] = None
    has_rental_property: Optional[bool] = None
    is_first_time_filer: Optional[bool] = None
    
    # Promoted high-priority fields (NEW)
    residency_status: Optional[str] = Field(None, description="resident | foreign_resident | working_holiday_maker")
    has_work_related_expenses: Optional[bool] = Field(None, description="Work-related deductions")
    has_private_health_insurance: Optional[bool] = Field(None, description="Private health insurance")
    has_hecs_debt: Optional[bool] = Field(None, description="HECS-HELP student loan")
    
    # Promoted medium-priority fields (NEW)
    has_capital_gains: Optional[bool] = Field(None, description="Capital gains/losses from investments")
    has_charity_donations: Optional[bool] = Field(None, description="Donations to DGRs")
    has_foreign_income: Optional[bool] = Field(None, description="Income from overseas")
    has_personal_super_contributions: Optional[bool] = Field(None, description="Personal super contributions")
    
    # Additional context
    additional_info: Optional[Dict[str, Any]] = None
```

### Phase 2: LLM Prompt Update

**File**: `Backend/app/services/llm_service.py`

- [ ] Update `generate_tax_checklist()` prompt to include new fields
- [ ] Add clear instructions for each field's impact on checklist
- [ ] Update examples to show field usage

```python
# Example prompt section:
"""
Generate a personalized Australian PERSONAL tax return checklist:

BASIC INFORMATION:
- Employment Status: {employment_status}
- Income Sources: {income_sources}
- Has Dependents: {has_dependents}
- Has Investments: {has_investment}
- Has Rental Property: {has_rental_property}
- First Time Filer: {is_first_time_filer}

TAX RESIDENCY & OBLIGATIONS:
- Residency Status: {residency_status}  ⭐ CRITICAL - affects tax rates
- Has HECS Debt: {has_hecs_debt}  ⭐ Include HECS repayment info
- Has Private Health Insurance: {has_private_health_insurance}  ⭐ Include MLS/rebate info

DEDUCTIONS & INCOME:
- Work-Related Expenses: {has_work_related_expenses}  ⭐ Include expense records
- Capital Gains: {has_capital_gains}  ⭐ Include CGT schedule
- Charity Donations: {has_charity_donations}  ⭐ Include DGR receipts
- Foreign Income: {has_foreign_income}  ⭐ Include foreign tax credits
- Personal Super: {has_personal_super_contributions}  ⭐ Include contribution records

Additional Context: {additional_info}

INSTRUCTIONS:
- For residency_status='foreign_resident': Emphasize NO tax-free threshold
- For has_hecs_debt=True: Add task for HECS repayment calculation
- For has_work_related_expenses=True: Add detailed expense documentation task
- For has_capital_gains=True: Add CGT calculation worksheet task
- Adjust complexity: simple (5-8 items), moderate (8-12), complex (12-18)
"""
```

### Phase 3: Frontend Form Update

**File**: `Frontend/src/app/checklist/generate/page.tsx`

- [ ] Verify all new fields have form inputs (most already exist!)
- [ ] Update `createIdentityInfo()` to map fields correctly
- [ ] Move fields from `additional_info` to top-level in the payload

```typescript
// Current mapping (needs update):
const identityInfo = createIdentityInfo(values.employmentStatus, {
  incomeSources: values.incomeSources,
  hasDependents: values.hasDependents,
  hasInvestment: values.hasInvestment,
  hasRentalProperty: values.hasRentalProperty,
  isFirstTimeFiler: values.isFirstTimeFiler,
  
  // NEW: Promote these to top-level
  residencyStatus: values.residencyStatus,
  hasWorkRelatedExpenses: values.hasWorkExpenses,  // Note: form has this field!
  hasPrivateHealthInsurance: values.hasPrivateHealthInsurance,
  hasHECSDebt: values.hasHECSDebt,
  hasCapitalGains: values.hasSoldHome || values.hasCryptoCurrency,  // Infer from related fields
  hasCharityDonations: values.hasCharityDonations,
  hasForeignIncome: values.hasForeignIncome,
  hasPersonalSuperContributions: values.hasSuperContributions,
  
  // Rest stay in additional_info
  additionalInfo: {
    number_of_dependents: values.numberOfDependents,
    number_of_rental_properties: values.numberOfProperties,
    has_home_office: values.hasHomeOffice,
    has_crypto: values.hasCryptoCurrency,
    // ... other fields
  }
})
```

### Phase 4: Service Layer Update

**File**: `Frontend/src/services/checklistService.ts`

- [ ] Update TypeScript interfaces to match new schema
- [ ] Ensure type safety for new fields

```typescript
export interface ChecklistIdentityInfo {
  employment_status: string
  income_sources: string[]
  has_dependents?: boolean
  has_investment?: boolean
  has_rental_property?: boolean
  is_first_time_filer?: boolean
  
  // NEW promoted fields
  residency_status?: "resident" | "foreign_resident" | "working_holiday_maker"
  has_work_related_expenses?: boolean
  has_private_health_insurance?: boolean
  has_hecs_debt?: boolean
  has_capital_gains?: boolean
  has_charity_donations?: boolean
  has_foreign_income?: boolean
  has_personal_super_contributions?: boolean
  
  additional_info?: Record<string, any>
}
```

### Phase 5: Identity Extractor Update (Free Chat Mode)

**File**: `Backend/app/services/identity_extractor_service.py`

- [ ] Update `REQUIRED_FIELDS` and `OPTIONAL_FIELDS`
- [ ] Update extraction prompt to include new fields
- [ ] Update `format_for_checklist()` to map new fields correctly

```python
REQUIRED_FIELDS = {
    "employment_status": [...],
    "income_sources": list,
    "has_dependents": bool,
}

OPTIONAL_FIELDS = {
    # High priority (promoted)
    "residency_status": str,
    "has_work_related_expenses": bool,
    "has_private_health_insurance": bool,
    "has_hecs_debt": bool,
    "has_capital_gains": bool,
    "has_charity_donations": bool,
    "has_foreign_income": bool,
    "has_personal_super_contributions": bool,
    
    # Supporting fields
    "has_investment": bool,
    "has_rental_property": bool,
    "is_first_time_filer": bool,
    # ...
}
```

---

## 🎯 Why These Specific Fields?

### Critical Fields (Must Have)

1. **`residency_status`** 
   - Impacts: Tax-free threshold, Medicare levy, tax rates
   - Example: Foreign residents pay 32.5% from $0 (no $18,200 threshold)

2. **`has_work_related_expenses`**
   - 80%+ of taxpayers claim work deductions
   - Adds: Receipt requirements, logbook, home office diary

3. **`has_private_health_insurance`**
   - Affects: Medicare Levy Surcharge (MLS), rebate
   - High-income earners without PHI pay extra 1-1.5% MLS

4. **`has_hecs_debt`**
   - Impacts: PAYG withholding, repayment calculations
   - Threshold: $51,550 (2023-24) triggers 1-10% repayment

### High-Value Fields (Should Have)

5. **`has_capital_gains`**
   - Complex calculations: Cost base, 12-month rule, 50% discount
   - Adds: CGT schedule, records of purchase/sale

6. **`has_charity_donations`**
   - Common deduction, requires DGR receipts ($2+)
   - Adds: Donation receipt collection task

7. **`has_foreign_income`**
   - Significantly increases complexity
   - Adds: Foreign tax credit calculations, dual-residency issues

8. **`has_personal_super_contributions`**
   - Tax optimization opportunity
   - Adds: Co-contribution, deduction claims, contribution caps

---

## 📊 Expected Impact on Checklist

### Before Enhancement (MVP v1.0)
**Simple Case**: 5-8 items (generic)  
**Complex Case**: 8-12 items (somewhat personalized)

### After Enhancement (MVP v1.1)
**Simple Case** (resident, employed, salary only, no HECS):
- 5-7 items (streamlined for simple situation)

**Moderate Case** (resident, employed, work expenses, PHI, HECS):
- 8-11 items (adds expense tracking, PHI statement, HECS info)

**Complex Case** (self-employed, multiple income, rental, investments, foreign income):
- 13-18 items (comprehensive coverage of all obligations)

---

## 🔄 Migration Notes

### Backward Compatibility
- All new fields are **Optional** - existing API calls still work
- Frontend can be updated independently of backend
- Old checklists remain valid

### Testing Strategy
1. Test with minimal fields (only 6 core fields)
2. Test with all new fields populated
3. Test mixed scenarios (some new fields, some missing)
4. Compare checklist outputs before/after

---

## 📚 Reference Documents

- **Australian Tax Reference**: `docs/AUSTRALIAN_TAX_REFERENCE.md`
- **Project Overview**: `docs/PROJECT_OVERVIEW.md`
- **Current Schema**: `Backend/app/schemas/schemas.py`
- **Current Form**: `Frontend/src/app/checklist/generate/page.tsx`

---

## 🚀 Quick Start for AI Assistant

When user says: "Update checklist fields based on the specification"

**Step 1**: Read this document completely  
**Step 2**: Follow "Implementation Checklist" in order (Phase 1-5)  
**Step 3**: Update each file as specified  
**Step 4**: Add debug logging to verify field mapping  
**Step 5**: Test with sample data

---

**Version**: 1.0  
**Status**: Ready for Implementation  
**Estimated Effort**: 2-3 hours of focused development

---

## 📋 Summary Table for Quick Reference

| Priority | Field Name | Type | Impact | Currently in Form | Already Top-Level |
|----------|-----------|------|---------|------------------|-------------------|
| 🔥 Critical | `residency_status` | string | Tax rates, threshold | ✅ Yes | ❌ No (in additional_info) |
| 🔥 Critical | `has_work_related_expenses` | bool | Receipt requirements | ✅ Yes | ❌ No (in additional_info) |
| 🔥 Critical | `has_private_health_insurance` | bool | MLS & rebate | ✅ Yes | ❌ No (in additional_info) |
| 🔥 Critical | `has_hecs_debt` | bool | PAYG withholding | ✅ Yes | ❌ No (in additional_info) |
| 📈 High | `has_capital_gains` | bool | CGT calculations | ⚠️ Partial (infer from sold_home, crypto) | ❌ No |
| 📈 High | `has_charity_donations` | bool | DGR receipts | ✅ Yes | ❌ No (in additional_info) |
| 📈 High | `has_foreign_income` | bool | Foreign tax credits | ✅ Yes | ❌ No (in additional_info) |
| 📈 High | `has_personal_super_contributions` | bool | Co-contribution | ✅ Yes | ❌ No (in additional_info) |

**Observation**: Most fields are already collected in the form! They just need to be **promoted to top-level** in the API payload and **explicitly used in the LLM prompt**.
