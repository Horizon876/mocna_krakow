import { describe, it, expect } from 'vitest';
import { parseInPostPointAddress, type InPostPointLike } from '../inpost-point';

describe('parseInPostPointAddress', () => {
  it('powinien poprawnie sparsować adres z obiektu z address_details', () => {
    const point: InPostPointLike = {
      address_details: {
        city: 'Kraków',
        post_code: '31-001',
        street: 'Starowiślna',
        building_number: '12',
      }
    };
    
    const result = parseInPostPointAddress(point);
    
    expect(result).toEqual({
      city: 'Kraków',
      zipCode: '31-001',
      address: 'Starowiślna 12',
    });
  });

  it('powinien poprawnie sparsować adres z obiektu z line1 i line2', () => {
    const point: InPostPointLike = {
      address: {
        line1: 'Kawiarnia 1',
        line2: '31-801 Kraków',
      }
    };
    
    const result = parseInPostPointAddress(point);
    
    expect(result).toEqual({
      city: 'Kraków',
      zipCode: '31-801',
      address: 'Kawiarnia 1',
    });
  });

  it('powinien korzystać z point.name jako adresu jeśli brak innych danych', () => {
    const point: InPostPointLike = {
      name: 'Paczkomat KRA01A',
      address: {
        city: 'Warszawa',
        post_code: '00-001'
      }
    };
    
    const result = parseInPostPointAddress(point);
    
    expect(result).toEqual({
      city: 'Warszawa',
      zipCode: '00-001',
      address: 'Paczkomat KRA01A',
    });
  });

  it('powinien radzić sobie z pustym obiektem', () => {
    const result = parseInPostPointAddress({});
    
    expect(result).toEqual({
      city: '',
      zipCode: '',
      address: '',
    });
  });
});
