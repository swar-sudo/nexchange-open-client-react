import React, { Component } from 'react';
import axios from 'axios';
import config from '../../config';
import KYCModalTier0 from './KYCModalTier0';
import DesktopNotifications from '../DesktopNotifications';
import OrderPaymentForm from './OrderPaymentForm';

class OrderInitial extends Component {
  constructor(props) {
    super(props);
    this.state = { showKYCModal: false };
    this.checkKYC = this.checkKYC.bind(this);
  }

  componentDidMount() {
    this.checkKYC(true);
  }

  checkKYC(firstTime) {
    clearTimeout(this.timeout);

    axios
      .get(`${config.API_BASE_URL}/kyc/${this.props.order.unique_reference}`)
      .then(response => {
        const kyc = response.data;
        this.setState({ kyc });

        console.log(kyc);

        if (
          firstTime &&
          (kyc.id_document_status === 'UNDEFINED' ||
            kyc.residence_document_status === 'UNDEFINED')
        ) {
          setTimeout(() => {
            this.setState({ showKYCModal: true });
          }, 1000);
        }

        this.timeout = setTimeout(() => {
          this.checkKYC();
        }, config.KYC_DETAILS_FETCH_INTERVAL);
      })
      .catch(error => {
        this.timeout = setTimeout(() => {
          this.checkKYC();
        }, config.KYC_DETAILS_FETCH_INTERVAL);
      });
  }

  componentWillUnmount() {
    clearTimeout(this.timeout);
  }

  render() {
    let inner;
    let buttonText;
    let notificationsCtaVisible = false;

    if (!this.state.kyc) {
      inner = <h2>Checking KYC status...</h2>;
    } else if (
      this.state.kyc.id_document_status !== 'APPROVED' &&
      this.state.kyc.residence_document_status !== 'APPROVED'
    ) {
      if (
        this.state.kyc.id_document_status === 'UNDEFINED' &&
        this.state.kyc.residence_document_status === 'UNDEFINED'
      ) {
        inner = (
          <div>
            <h2>Awaiting verification</h2>
            <h5>
              In order to proceed further we must get to know you better by
              getting a copy of your government issued ID and a proof of
              residence.
            </h5>
            <h5 style={{ marginTop: 15 }}>
              <b>
                This is a one-time process, once verified you’ll be able to
                complete future purchases instantly until current verification
                tier limits are reached.
              </b>
            </h5>
          </div>
        );

        buttonText = 'Get verified';
      } else {
        inner = (
          <div>
            <h2>Verification received, awaiting approval</h2>

            <hr style={{ marginLeft: -15, marginRight: -15 }} />

            <h2>Approval status:</h2>
            <p style={{ margin: 0 }}>
              <b>Government issued ID:</b> {this.state.kyc.id_document_status}
            </p>
            <p>
              <b>Proof of residence:</b>{' '}
              {this.state.kyc.residence_document_status}
            </p>

            {this.state.kyc &&
              this.state.kyc.user_visible_comment && (
                <p>
                  <b>
                    Reason for rejection: {this.state.kyc.user_visible_comment}
                  </b>
                </p>
              )}
          </div>
        );

        notificationsCtaVisible = true;

        if (
          this.state.kyc.id_document_status === 'REJECTED' &&
          this.state.kyc.residence_document_status === 'REJECTED'
        ) {
          buttonText = 'Retry verification';
        } else if (
          (this.state.kyc.id_document_status === 'APPROVED' ||
            this.state.kyc.id_document_status === 'PENDING') &&
          this.state.kyc.residence_document_status === 'REJECTED'
        ) {
          buttonText = 'Retry proof of residence verification';
        } else if (
          (this.state.kyc.residence_document_status === 'APPROVED' ||
            this.state.kyc.residence_document_status === 'PENDING') &&
          this.state.kyc.id_document_status === 'REJECTED'
        ) {
          buttonText = 'Retry government issued ID verification';
        }
      }
    } else if (
      this.state.kyc.id_document_status === 'APPROVED' &&
      this.state.kyc.residence_document_status === 'APPROVED'
    ) {
      return <OrderPaymentForm {...this.props} />;
    }

    return (
      <div className="col-xs-12 text-center order-status-section">
        {inner}

        <DesktopNotifications
          kyc={this.state.kyc}
          {...this.props}
          visible={notificationsCtaVisible}
        />
        {buttonText && (
          <button
            type="button"
            className="btn btn-default btn-themed"
            onClick={() => this.setState({ showKYCModal: true })}
            style={{ marginTop: 20 }}
          >
            <i
              className="fa fa-credit-card"
              aria-hidden="true"
              style={{ position: 'relative', left: -13 }}
            />
            {buttonText}
          </button>
        )}
        {this.state.kyc && (
          <KYCModalTier0
            show={this.state.showKYCModal}
            onClose={() => {
              this.setState({ showKYCModal: false });
              this.checkKYC();
            }}
            kyc={this.state.kyc}
            {...this.props}
          />
        )}
      </div>
    );
  }
}

export default OrderInitial;
