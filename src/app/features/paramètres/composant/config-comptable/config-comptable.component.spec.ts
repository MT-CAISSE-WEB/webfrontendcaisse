import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigComptableComponent } from './config-comptable.component';

describe('ConfigComptableComponent', () => {
  let component: ConfigComptableComponent;
  let fixture: ComponentFixture<ConfigComptableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigComptableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfigComptableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
