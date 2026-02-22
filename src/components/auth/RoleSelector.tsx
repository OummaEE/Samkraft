import type { UserRole } from '../../types'

const options: Array<{ value: UserRole; label: string; hint?: string }> = [
  { value: 'migrant', label: 'Migrant' },
  { value: 'volunteer', label: 'Volontär' },
  { value: 'mentor', label: 'Mentor' },
  { value: 'pending_admin', label: 'Kommunadministratör', hint: '(kräver godkännande)' },
]

interface Props {
  value: UserRole
  onChange: (role: UserRole) => void
}

export default function RoleSelector({ value, onChange }: Props) {
  return (
    <div className="form-row">
      <label htmlFor="role">Roll</label>
      <select id="role" value={value} onChange={(e) => onChange(e.target.value as UserRole)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}{option.hint ? ` ${option.hint}` : ''}
          </option>
        ))}
      </select>
    </div>
  )
}