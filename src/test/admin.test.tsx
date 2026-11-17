import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AdminApp from '../admin/AdminApp';

describe('painel privado', () => {
  it('não apresenta login nem dados quando não há configuração Supabase', () => {
    render(<AdminApp />);

    expect(screen.getByText('Painel ainda não configurado')).toBeInTheDocument();
    expect(screen.queryByLabelText('Email administrativo')).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
