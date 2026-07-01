import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParametreDiverseComponent } from './parametre-diverse.component';

describe('ParametreDiverseComponent', () => {
  let component: ParametreDiverseComponent;
  let fixture: ComponentFixture<ParametreDiverseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParametreDiverseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParametreDiverseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
