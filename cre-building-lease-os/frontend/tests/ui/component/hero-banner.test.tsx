import { render, screen } from '@testing-library/react';
import HeroBanner from '@/components/HeroBanner';
import { describe, expect, it } from 'vitest';

describe('HeroBanner', () => {
  it('renders title/subtitle/chips for key pages', () => {
    render(
      <HeroBanner
        image="/brand/hero-building.jpg"
        title="商辦租賃總覽"
        subtitle="穩定管理"
        chips={['Lease', 'Repairs']}
      />,
    );

    expect(screen.getByRole('heading', { name: '商辦租賃總覽' })).toBeInTheDocument();
    expect(screen.getByText('穩定管理')).toBeInTheDocument();
    expect(screen.getByText('Lease')).toBeInTheDocument();
    expect(screen.getByText('Repairs')).toBeInTheDocument();
  });
});
